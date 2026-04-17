import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import crypto from "crypto";
import axios from "axios";

dotenv.config();

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(configPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!admin.apps?.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
}

const db = admin.firestore();

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || "FLWSECK_TEST_MOCK";
if (FLUTTERWAVE_SECRET_KEY === "FLWSECK_TEST_MOCK") {
  console.warn("⚠️ FLUTTERWAVE_SECRET_KEY is not set. Using mock key.");
}

// Helper for backend safe write with backups
async function backendSafeWrite(collectionName: string, documentId: string, data: any, action: 'update' | 'create', performedBy: string = 'system') {
  try {
    const docRef = db.collection(collectionName).doc(documentId);
    const now = new Date().toISOString();
    
    // Backup before modification
    if (action === 'update') {
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        await db.collection(`${collectionName}_backup`).add({
          originalId: documentId,
          collectionName,
          data: docSnap.data(),
          action: 'update',
          timestamp: now,
          performedBy
        });
      }
    }

    if (action === 'update') {
      await docRef.update({
        ...data,
        updatedAt: now
      });
    } else {
      await docRef.set({
        ...data,
        createdAt: now,
        updatedAt: now
      });
    }
    return true;
  } catch (error) {
    console.error(`Backend safeWrite failed for ${collectionName}/${documentId}:`, error);
    return false;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // Flutterwave Webhook
  app.post("/api/flutterwave-webhook", async (req, res) => {
    // Note: In production you should verify the 'verif-hash' header
    const event = req.body;
    console.log('Flutterwave Webhook received:', event["event.type"]);

    if (event["event.type"] === "CHARGED") {
      const { customer, tx_ref, amount, meta } = event.data;
      const userId = meta?.userId;
      const plan = meta?.plan;
      
      console.log(`Webhook: Successful charge for ${userId}, Plan: ${plan}`);
      
      if (userId && plan) {
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + 30);
        
        await backendSafeWrite('users', userId, {
          plan,
          isPremium: true,
          subscriptionStatus: 'active',
          premiumUntil: premiumUntil.toISOString()
        }, 'update', 'flutterwave-webhook');
      }
    }

    res.json({ received: true });
  });

  // SEO Routes
  app.get("/robots.txt", (req, res) => {
    const robots = `User-agent: *
Allow: /
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`;
    res.type('text/plain');
    res.send(robots);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const host = `${req.protocol}://${req.get('host')}`;
      const blogsSnapshot = await db.collection('blogs').where('published', '==', true).get();
      const usersSnapshot = await db.collection('users').get();

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${host}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${host}/pricing</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

      blogsSnapshot.forEach(doc => {
        const blog = doc.data();
        sitemap += `
  <url>
    <loc>${host}/blog/${blog.slug}</loc>
    <lastmod>${blog.updatedAt || blog.createdAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      usersSnapshot.forEach(doc => {
        const user = doc.data();
        if (user.username) {
          sitemap += `
  <url>
    <loc>${host}/${user.username}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        }
      });

      sitemap += `\n</urlset>`;
      res.type('application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/verify-flutterwave", async (req, res) => {
    const { transaction_id, tx_ref, userId, plan, isVerification, isOrder, amount } = req.body;
    console.log(`Verifying Flutterwave transaction: ${transaction_id} for user: ${userId}`);
    
    // 1. Double-check for duplicate transaction references
    try {
      const existingTx = await db.collection('transactions').where('reference', '==', tx_ref).get();
      if (!existingTx.empty) {
        console.warn(`Attempted duplicate processing for reference: ${tx_ref}`);
        return res.status(400).json({ status: 'failed', error: 'Transaction already processed' });
      }

      let flwData: any;

      if (FLUTTERWAVE_SECRET_KEY === "FLWSECK_TEST_MOCK") {
        console.log("🛠️ Using mock verification for development.");
        flwData = {
          status: 'successful',
          amount: amount || 5000,
          card: {
            first_6digits: '123456',
            last_4digits: '1234',
            issuer: 'Mock Bank',
            type: 'VISA',
            expiry: '12/30'
          }
        };
      } else {
        const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
          headers: {
            Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`
          }
        });
        flwData = response.data.data;
      }

      console.log(`Flutterwave verification status for ${transaction_id}:`, flwData.status);

      if (flwData.status === 'successful') {
        // 2. Save transaction history BEFORE upgrading to ensure we have a record
        await db.collection('transactions').add({
          userId: userId || 'guest',
          reference: tx_ref,
          flw_id: transaction_id,
          amount: amount || flwData.amount,
          plan: isVerification ? 'verification' : (isOrder ? 'order' : (plan || 'pro')),
          status: 'success',
          createdAt: new Date().toISOString(),
          metadata: {
            card_type: flwData.card?.type,
            last4: flwData.card?.last_4digits,
            issuer: flwData.card?.issuer
          }
        });

        if (isVerification) {
          if (!userId) throw new Error("User ID is required for verification");
          await backendSafeWrite('users', userId, { isVerified: true }, 'update', 'flutterwave-verify');
        } else if (isOrder) {
          // Log the order
          await db.collection('orders').add({
            userId: userId || 'guest',
            amount: amount,
            reference: tx_ref,
            status: 'paid',
            createdAt: new Date().toISOString()
          });
        } else {
          if (!userId) throw new Error("User ID is required for subscription");
          const premiumUntil = new Date();
          premiumUntil.setDate(premiumUntil.getDate() + 30);
          
          await backendSafeWrite('users', userId, {
            plan: plan || 'pro',
            isPremium: true,
            subscriptionStatus: 'active',
            premiumUntil: premiumUntil.toISOString()
          }, 'update', 'flutterwave-verify');
        }
        
        return res.json({ status: 'success' });
      }
      
      res.status(400).json({ status: 'failed' });
    } catch (error: any) {
      console.error('Paystack verification error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Subscription Expiry Logic
  app.post("/api/cron/check-subscriptions", async (req, res) => {
    // This could be called by a scheduled task
    const now = new Date().toISOString();
    try {
      const expiredSnapshot = await db.collection('users')
        .where('isPremium', '==', true)
        .where('premiumUntil', '<', now)
        .get();

      if (expiredSnapshot.empty) {
        return res.json({ status: 'success', count: 0 });
      }

      const batch = db.batch();
      expiredSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          isPremium: false,
          subscriptionStatus: 'inactive',
          updatedAt: now
        });
      });
      
      await batch.commit();
      console.log(`Processed ${expiredSnapshot.size} expired subscriptions`);
      res.json({ status: 'success', count: expiredSnapshot.size });
    } catch (error: any) {
      console.error('Subscription expiry check failed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
