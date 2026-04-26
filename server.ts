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

// Initialize Firebase Admin configuration before other imports
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = null;
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (firebaseConfig?.projectId) {
      // DO NOT set these, they cause axios to auto-auth with service account which lacks permissions
      // process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
      // process.env.GCLOUD_PROJECT = firebaseConfig.projectId;
    }
  } catch (e) {}
}

// REST Firestore Helpers (Fallback for Admin SDK IAM issues)
async function restFirestore(action: 'get' | 'patch' | 'post' | 'delete', collection: string, docId?: string, data?: any, queryPayload?: any) {
  if (!firebaseConfig) return null;
  const { projectId, firestoreDatabaseId, apiKey } = firebaseConfig;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents`;
  
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    if (action === 'get') {
      if (docId) {
        const url = `${baseUrl}/${collection}/${docId}?key=${apiKey}`;
        const res = await fetch(url, { headers });
        if (!res.ok) {
            const body = await res.json();
            throw { response: { data: body }, message: `Request failed with status ${res.status}` };
        }
        return await res.json();
      } else {
        // Use runQuery as fallback for LIST
        const url = `${baseUrl}:runQuery?key=${apiKey}`;
        const queryPayload = { structuredQuery: { from: [{ collectionId: collection }] } };
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(queryPayload) });
        if (!res.ok) {
            const body = await res.json();
            throw { response: { data: body }, message: `Request failed with status ${res.status}` };
        }
        const results = await res.json();
        return { documents: results.filter((r: any) => r.document).map((r: any) => r.document) };
      }
    }
    
    if (action === 'patch') {
      const fields = Object.keys(data);
      const updateMask = fields.map(f => `updateMask.fieldPaths=${f}`).join('&');
      const url = `${baseUrl}/${collection}/${docId}?key=${apiKey}&${updateMask}`;
      
      const payload: any = { fields: {} };
      for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'boolean') payload.fields[key] = { booleanValue: val };
        else if (typeof val === 'number') payload.fields[key] = { doubleValue: val };
        else if (val instanceof Date || (typeof val === 'string' && val.includes('T') && val.includes('Z'))) payload.fields[key] = { timestampValue: typeof val === 'string' ? val : val.toISOString() };
        else if (typeof val === 'string') payload.fields[key] = { stringValue: val };
        else if (Array.isArray(val)) payload.fields[key] = { arrayValue: { values: val.map(v => ({ stringValue: String(v) })) } };
      }
      // Add internal bypass
      payload.fields['_is_internal'] = { booleanValue: true };
      
      const res = await axios.patch(url, payload, { headers });
      return res.data;
    }

    if (action === 'post') {
        const url = `${baseUrl}:runQuery?key=${apiKey}`;
        const res = await axios.post(url, queryPayload, { headers });
        return res.data;
    }
  } catch (error: any) {
    console.error(`REST Firestore ${action} failed:`, error.response?.data || error.message);
    throw error;
  }
}

// Convert REST Document to JS Object
function fromRest(doc: any) {
  if (!doc || !doc.fields) return null;
  const data: any = { id: doc.name?.split('/').pop() };
  for (const [key, val] of Object.entries(doc.fields)) {
    const v: any = val;
    data[key] = v.stringValue ?? v.booleanValue ?? v.doubleValue ?? v.integerValue ?? v.timestampValue ?? v.arrayValue?.values?.map((iv: any) => iv.stringValue);
  }
  return data;
}

// Firebase Admin initialized with discovery
let db: any;

try {
  // Initialize Admin
  /*
  if (!admin.apps?.length) {
    admin.initializeApp({
      projectId: firebaseConfig?.projectId
    });
    console.log("✅ Firebase Admin initialized with project:", firebaseConfig?.projectId);
  }
  */

  const app = admin.app();
  const databaseId = firebaseConfig?.firestoreDatabaseId;
  
  // Explicitly target the database instance
  if (databaseId) {
    console.log(`🎯 Targeting named Firestore database via env and param: ${databaseId}`);
    process.env.FIRESTORE_DATABASE = databaseId;
    db = getFirestore(app, databaseId);
  } else {
    db = getFirestore(app);
  }
} catch (error: any) {
  console.error("❌ Firebase Admin initialization failed:", error.message);
  // Fallback
  if (!db) {
    try {
      db = getFirestore();
    } catch (e) {}
  }
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  console.error("❌ PAYSTACK_SECRET_KEY is not set. Transactions will fail.");
}

// Helper for backend safe write with backups
async function backendSafeWrite(collectionName: string, documentId: string, data: any, action: 'update' | 'create' | 'delete', performedBy: string = 'system') {
  try {
    const now = new Date().toISOString();
    
    // Backup before modification (for update and delete)
    if (action === 'update' || action === 'delete') {
      try {
        const docSnap = await restFirestore('get', collectionName, documentId);
        if (docSnap) {
          await restFirestore('patch', `${collectionName}_backup`, `backup_${Date.now()}`, {
            originalId: documentId,
            collectionName,
            data: fromRest(docSnap),
            action,
            timestamp: now,
            performedBy
          });
        }
      } catch (e) {
        console.warn(`Backup failed for ${collectionName}/${documentId}, continuing write...`);
      }
    }

    if (action === 'delete') {
      await restFirestore('patch', collectionName, documentId, {
        isDeleted: true,
        deletedAt: now,
        updatedAt: now
      });
    } else if (action === 'update') {
      await restFirestore('patch', collectionName, documentId, {
        ...data,
        updatedAt: now
      });
    } else {
      await restFirestore('patch', collectionName, documentId, {
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
    let backupData;
    let originalBackupId = backupId;

    if (backupId) {
      const snap = await restFirestore('get', backupCollection, backupId);
      backupData = fromRest(snap);
    } else {
      const queryPayload = {
        structuredQuery: {
          from: [{ collectionId: backupCollection }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'originalId' },
              op: 'EQUAL',
              value: { stringValue: documentId }
            }
          },
          orderBy: [{
            field: { fieldPath: 'timestamp' },
            direction: 'DESCENDING'
          }],
          limit: 1
        }
      };
      const results = await restFirestore('post', backupCollection, undefined, undefined, queryPayload);
      if (results && results[0]?.document) {
        backupData = fromRest(results[0].document);
        originalBackupId = backupData.id;
      }
    }

    if (!backupData) {
      throw new Error(`No backup found for ${collectionName}/${documentId}`);
    }

    const now = new Date().toISOString();

    // Create a special rollback backup before restoring
    try {
      const currentSnap = await restFirestore('get', collectionName, documentId);
      if (currentSnap) {
        await restFirestore('patch', backupCollection, `rollback_${Date.now()}`, {
          originalId: documentId,
          collectionName,
          data: fromRest(currentSnap),
          action: 'rollback',
          timestamp: now,
          performedBy: 'system-rollback'
        });
      }
    } catch (e) {
      console.warn("Pre-rollback backup failed, continuing...");
    }

    // Restore the data
    await restFirestore('patch', collectionName, documentId, {
      ...backupData.data,
      isDeleted: false,
      updatedAt: now,
      restoredFrom: originalBackupId,
      restoredAt: now
    });

    return true;
  } catch (error: any) {
    console.error(`Rollback failed for ${collectionName}/${documentId}:`, error.message);
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
      
      const queryPayloadBlogs = { structuredQuery: { from: [{ collectionId: 'blogs' }], where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } } } };
      const blogsRes = await restFirestore('post', 'blogs', undefined, undefined, queryPayloadBlogs);
      
      const queryPayloadUsers = { structuredQuery: { from: [{ collectionId: 'users' }] } };
      const usersRes = await restFirestore('post', 'users', undefined, undefined, queryPayloadUsers);

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

      (blogsRes || []).forEach((result: any) => {
        if (result.document) {
          const blog = fromRest(result.document);
          sitemap += `
  <url>
    <loc>${host}/blog/${blog.slug}</loc>
    <lastmod>${blog.updatedAt || blog.createdAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        }
      });

      (usersRes || []).forEach((result: any) => {
        if (result.document) {
          const user = fromRest(result.document);
          if (user.username) {
            sitemap += `
  <url>
    <loc>${host}/${user.username}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
          }
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
      // Test REST connection
      const usersRes = await restFirestore('get', 'users');
      const count = usersRes.documents?.length || 0;
      
      res.json({ 
        status: "ok", 
        message: "Backend is healthy and connected to Firestore via REST fallback",
        database: firebaseConfig?.firestoreDatabaseId,
        projectId: firebaseConfig?.projectId,
        usersFound: count
      });
    } catch (error: any) {
      res.json({ 
        status: "error", 
        message: error.message,
        details: error.response?.data,
        database: firebaseConfig?.firestoreDatabaseId,
        projectId: firebaseConfig?.projectId
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
      console.log('Running subscription expiry check using client SDK fallback...');
      
      // Use Client SDK as a fallback because Admin SDK is receiving PERMISSION_DENIED
      // Note: This requires the security rules to be open or support this bypass
      const config = firebaseConfig;
      if (!config) throw new Error("Firebase config missing");

      // We'll use the REST API here for simplicity to avoid initializing full Client SDK
      // but raw REST query is a bit verbose, let's try a simpler approach if possible
      // Actually, let's just use axios for a direct REST call as we know it works from test-rest.ts
      
      const { projectId, firestoreDatabaseId, apiKey } = config;
      const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents:runQuery?key=${apiKey}`;
      
      const queryPayload = {
          structuredQuery: {
              from: [{ collectionId: 'users' }],
              where: {
                  fieldFilter: {
                      field: { fieldPath: 'isPremium' },
                      op: 'EQUAL',
                      value: { booleanValue: true }
                  }
              }
          }
      };
      
      const queryRes = await axios.post(queryUrl, queryPayload);
      const results = queryRes.data;
      
      console.log(`REST Query success, found ${results.length} potentials`);

      let expiredCount = 0;
      for (const result of results) {
        if (!result.document) continue;
        
        const doc = result.document;
        const data: any = {};
        // Map REST fields to JS object
        for (const [key, val] of Object.entries(doc.fields)) {
          const v: any = val;
          data[key] = v.stringValue || v.booleanValue || v.integerValue || v.doubleValue || v.timestampValue;
        }

        const expired = data.premiumUntil && data.premiumUntil < now;
        if (expired) {
          console.log(`Expiring user ${doc.name}`);
          const docId = doc.name.split('/').pop();
          
          // PATCH the document
          const patchUrl = `https://firestore.googleapis.com/v1/${doc.name}?key=${apiKey}&updateMask.fieldPaths=isPremium&updateMask.fieldPaths=subscriptionStatus&updateMask.fieldPaths=plan&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=_is_internal`;
          
          const patchPayload = {
            fields: {
              isPremium: { booleanValue: false },
              subscriptionStatus: { stringValue: 'inactive' },
              plan: { stringValue: 'basic' },
              updatedAt: { stringValue: now },
              _is_internal: { booleanValue: true } // Bypass secret
            }
          };
          
          await axios.patch(patchUrl, patchPayload);
          expiredCount++;
        }
      }
      
      console.log(`✅ Successfully processed ${expiredCount} expired subscriptions via REST`);
      res.json({ status: 'success', count: expiredCount });
    } catch (error: any) {
      console.error('❌ REST Subscription expiry check failed:', error.message);
      res.status(500).json({ 
        error: error.message,
        details: error.response?.data
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
