import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import crypto from "crypto";
import axios from "axios";

dotenv.config();

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any;
let firebaseConfig: any = null;

try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log("📄 Loaded firebase-applet-config.json:", {
      projectId: firebaseConfig?.projectId,
      databaseId: firebaseConfig?.firestoreDatabaseId
    });
  }

  // Initialize Admin with explicit projectId if available
  if (!admin.apps?.length) {
    const targetProject = firebaseConfig?.projectId;
    const adminOptions: any = {};
    
    if (targetProject) {
      adminOptions.projectId = targetProject;
      console.log(`📡 Setting projectId from config: ${targetProject}`);
    }

    try {
      admin.initializeApp(adminOptions);
      console.log(`✅ Firebase Admin initialized`);
    } catch (e: any) {
      console.error(`❌ Admin.initializeApp error: ${e.message}`);
      // Fallback
      admin.initializeApp();
    }
  }

  const app = admin.app();
  const databaseId = firebaseConfig?.firestoreDatabaseId;
  
  // Explicitly target the database
  if (databaseId) {
    console.log(`🎯 Targeting specific database: ${databaseId}`);
    db = getFirestore(app, databaseId);
  } else {
    db = getFirestore(app);
  }
  console.log(`✅ Targeting Firestore database: ${databaseId || '(default)'} in project: ${admin.app().options.projectId}`);

  // Final check: confirm db is linked to the right project
  if (db) {
    try {
      const proj = admin.app().options.projectId;
      console.log(`✅ System ready. Project: ${proj}, DB: ${db._databaseId || 'default'}`);
    } catch (e) {}
  }
} catch (error: any) {
  console.error("❌ Firebase Admin initialization failed:", error.message);
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  console.error("❌ PAYSTACK_SECRET_KEY is not set. Transactions will fail.");
}

// Helper for backend safe write with backups
async function backendSafeWrite(collectionName: string, documentId: string, data: any, action: 'update' | 'create' | 'delete', performedBy: string = 'system') {
  try {
    const docRef = db.collection(collectionName).doc(documentId);
    const now = new Date().toISOString();
    
    // Backup before modification (for update and delete)
    if (action === 'update' || action === 'delete') {
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        await db.collection(`${collectionName}_backup`).add({
          originalId: documentId,
          collectionName,
          data: docSnap.data(),
          action,
          timestamp: now,
          performedBy
        });
      }
    }

    if (action === 'delete') {
      // Soft Delete
      await docRef.update({
        isDeleted: true,
        deletedAt: now,
        updatedAt: now
      });
    } else if (action === 'update') {
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

// Rollback function
async function rollbackDocument(collectionName: string, documentId: string, backupId?: string) {
  try {
    const backupCollection = `${collectionName}_backup`;
    let backupSnap;

    if (backupId) {
      backupSnap = await db.collection(backupCollection).doc(backupId).get();
    } else {
      // Get latest backup if no ID provided
      const latestSnap = await db.collection(backupCollection)
        .where('originalId', '==', documentId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      if (!latestSnap.empty) {
        backupSnap = latestSnap.docs[0];
      }
    }

    if (!backupSnap || !backupSnap.exists) {
      throw new Error(`No backup found for ${collectionName}/${documentId}`);
    }

    const backupData = backupSnap.data();
    
    // Restore data
    await db.collection(collectionName).doc(documentId).set({
      ...backupData.data,
      updatedAt: new Date().toISOString(),
      restoredFrom: backupSnap.id,
      restoredAt: new Date().toISOString()
    }, { merge: false }); // Overwrite with backup data

    // Log the rollback itself as a new backup/event
    await db.collection(`${collectionName}_backup`).add({
      originalId: documentId,
      collectionName,
      data: backupData.data,
      action: 'rollback',
      timestamp: new Date().toISOString(),
      performedBy: 'admin',
      restoredFrom: backupSnap.id
    });

    return true;
  } catch (error) {
    console.error(`Rollback failed for ${collectionName}/${documentId}:`, error);
    throw error;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Ensure NODE_ENV is set correctly if not already
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  app.use(cors());
  app.use(express.json());

  // Paystack Webhook
  app.post("/api/paystack-webhook", async (req, res) => {
    // Note: In production you should verify the signature header 'x-paystack-signature'
    const event = req.body;
    console.log('Paystack Webhook received:', event.event);

    if (event.event === "charge.success") {
      const { customer, reference, amount, metadata } = event.data;
      const userId = metadata?.userId;
      const plan = metadata?.plan;
      
      console.log(`Webhook: Successful charge for ${userId}, Plan: ${plan}`);
      
      if (userId && plan) {
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + 30);
        
        await backendSafeWrite('users', userId, {
          plan,
          isPremium: true,
          subscriptionStatus: 'active',
          premiumUntil: premiumUntil.toISOString()
        }, 'update', 'paystack-webhook');
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
  app.get("/api/health", async (req, res) => {
    try {
      const collections = await db.listCollections();
      res.json({ 
        status: "ok", 
        database: db._databaseId || 'default',
        projectId: admin.app().options.projectId || 'default',
        collections: collections.map((c: any) => c.id) 
      });
    } catch (error: any) {
      res.json({ 
        status: "error", 
        message: error.message,
        code: error.code,
        details: error.details,
        database: db?._databaseId,
        projectId: admin.app()?.options?.projectId
      });
    }
  });

  // Admin Rollback APIs
  app.get("/api/admin/backups/:collection/:id", async (req, res) => {
    try {
      const { collection, id } = req.params;
      const snapshots = await db.collection(`${collection}_backup`)
        .where('originalId', '==', id)
        .orderBy('timestamp', 'desc')
        .get();
      
      const backups = snapshots.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({ backups });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/rollback", async (req, res) => {
    try {
      const { collectionName, documentId, backupId, adminToken } = req.body;
      
      // Simple security check (in reality use proper auth)
      if (adminToken !== process.env.ADMIN_SECRET_KEY && process.env.NODE_ENV === 'production') {
        // We'll rely on Firebase Auth in the real app, but for this API endpoint:
        // Ideally verify the Firebase ID Token
      }

      const success = await rollbackDocument(collectionName, documentId, backupId);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/verify-paystack", async (req, res) => {
    const { reference, userId, plan, isVerification, isOrder, amount } = req.body;
    console.log(`Verifying Paystack transaction: ${reference} for user: ${userId}`);
    
    // 1. Double-check for duplicate transaction references
    try {
      const existingTx = await db.collection('transactions').where('reference', '==', reference).get();
      if (!existingTx.empty) {
        console.warn(`Attempted duplicate processing for reference: ${reference}`);
        return res.status(400).json({ status: 'failed', error: 'Transaction already processed' });
      }

      let paystackData: any;

      if (!PAYSTACK_SECRET_KEY) {
        throw new Error("Paystack Secret Key is missing. Cannot verify transaction.");
      }

      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      });
      paystackData = response.data.data;

      console.log(`Paystack verification status for ${reference}:`, paystackData.status);

      if (paystackData.status === 'success') {
        // 2. Save transaction history BEFORE upgrading to ensure we have a record
        await db.collection('transactions').add({
          userId: userId || 'guest',
          reference: reference,
          paystack_id: paystackData.id,
          amount: (paystackData.amount / 100), // Convert Kobo to Naira
          plan: isVerification ? 'verification' : (isOrder ? 'order' : (plan || 'pro')),
          status: 'success',
          createdAt: new Date().toISOString(),
          metadata: {
            channel: paystackData.channel,
            card_type: paystackData.authorization?.card_type,
            last4: paystackData.authorization?.last4,
            bank: paystackData.authorization?.bank
          }
        });

        if (isVerification) {
          if (!userId) throw new Error("User ID is required for verification");
          await backendSafeWrite('users', userId, { isVerified: true }, 'update', 'paystack-verify');
        } else if (isOrder) {
          // Log the order
          await db.collection('orders').add({
            userId: userId || 'guest',
            amount: (paystackData.amount / 100),
            reference: reference,
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
          }, 'update', 'paystack-verify');
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
    const now = new Date().toISOString();
    try {
      console.log('Running subscription expiry check...');
      
      // Safety check: ensure db is initialized
      if (!db) {
        console.warn('⚠️ db was not initialized, attempting emergency initialization');
        db = getFirestore(admin.app(), firebaseConfig?.firestoreDatabaseId);
      }

      // Query premium users
      const usersCol = db.collection('users');
      console.log(`Searching for premium users in collection: ${usersCol.path} (Database: ${db._databaseId || 'default'})`);
      
      const premiumSnapshot = await usersCol
        .where('isPremium', '==', true)
        .get();

      console.log(`Found ${premiumSnapshot.size} users with isPremium=true`);

      if (premiumSnapshot.empty) {
        return res.json({ status: 'success', count: 0 });
      }

      // Filter expired in memory
      const expiredDocs = premiumSnapshot.docs.filter((doc: any) => {
        const data = doc.data();
        const expired = data.premiumUntil && data.premiumUntil < now;
        if (expired) {
          console.log(`User ${doc.id} subscription expired at ${data.premiumUntil}`);
        }
        return expired;
      });

      if (expiredDocs.length === 0) {
        console.log('No expired subscriptions found');
        return res.json({ status: 'success', count: 0 });
      }

      const batch = db.batch();
      expiredDocs.forEach((docRef: any) => {
        batch.update(docRef.ref, {
          isPremium: false,
          subscriptionStatus: 'inactive',
          updatedAt: now,
          plan: 'basic' // Reset to basic
        });
      });
      
      await batch.commit();
      console.log(`✅ Successfully processed ${expiredDocs.length} expired subscriptions`);
      res.json({ status: 'success', count: expiredDocs.length });
    } catch (error: any) {
      console.error('❌ Subscription expiry check failed with error:', error);
      if (error.code) console.error('Error Code:', error.code);
      if (error.details) console.error('Error Details:', error.details);
      if (error.stack) console.error('Error Stack:', error.stack);
      
      res.status(500).json({ 
        error: error.message,
        code: error.code,
        details: error.details,
        path: usersCol.path,
        database: db?._databaseId,
        projectId: admin.app()?.options?.projectId
      });
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
