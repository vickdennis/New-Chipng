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
import multer from "multer";

dotenv.config();

// Initialize Multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize Firebase Admin configuration before other imports
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = null;
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase Admin initialized with discovery
let db: any;
let bucket: any;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig?.projectId,
      storageBucket: firebaseConfig?.storageBucket
    });
    console.log("✅ Firebase Admin initialized");
  }

  const app = admin.app();
  const databaseId = firebaseConfig?.firestoreDatabaseId;
  
  if (databaseId) {
    db = getFirestore(app, databaseId);
    console.log(`🎯 Targeting named database: ${databaseId}`);
  } else {
    db = getFirestore(app);
  }
  
  bucket = admin.storage().bucket();
} catch (error: any) {
  console.error("❌ Firebase Admin initialization failed:", error.message);
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  console.error("❌ PAYSTACK_SECRET_KEY is not set. Transactions will fail.");
}

// REST Firestore Helpers (Fallback for Admin SDK IAM issues)
async function restFirestore(action: 'get' | 'patch' | 'post' | 'delete', collection: string, docId?: string, data?: any, queryPayload?: any) {
  // Try Admin SDK first if available
  if (db) {
    try {
      const colRef = db.collection(collection);
      if (action === 'get') {
        if (docId) {
          const docSnap = await colRef.doc(docId).get();
          if (!docSnap.exists) return null;
          // Return a REST-like structure so fromRest works
          return { name: docSnap.ref.path, fields: toRestFields(docSnap.data()) };
        } else {
          const snapshot = await colRef.get();
          return { documents: snapshot.docs.map(doc => ({ document: { name: doc.ref.path, fields: toRestFields(doc.data()) } })) };
        }
      }
      if (action === 'post' && queryPayload) {
        // Limited support for structured queries via Admin SDK for now
        const snapshot = await colRef.get();
        return snapshot.docs.map(doc => ({ document: { name: doc.ref.path, fields: toRestFields(doc.data()) } }));
      }
      if (action === 'patch' && docId && data) {
        await colRef.doc(docId).set(data, { merge: true });
        return { name: docId };
      }
    } catch (adminError) {
      console.warn('Admin SDK failed in restFirestore, falling back to REST:', adminError);
    }
  }

  if (!firebaseConfig) return null;
  const { projectId, firestoreDatabaseId, apiKey } = firebaseConfig;
  const dbId = firestoreDatabaseId && firestoreDatabaseId !== '' ? firestoreDatabaseId : '(default)';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents`;
  
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    if (action === 'get') {
      if (docId) {
        const url = `${baseUrl}/${collection}/${docId}?key=${apiKey}`;
        const res = await axios.get(url, { headers });
        return res.data;
      } else {
        const url = `${baseUrl}:runQuery?key=${apiKey}`;
        const query = { structuredQuery: { from: [{ collectionId: collection }] } };
        const res = await axios.post(url, query, { headers });
        return { documents: (res.data || []).filter((r: any) => r.document).map((r: any) => r.document) };
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
        else if (typeof val === 'object' && val !== null) payload.fields[key] = { mapValue: { fields: {} } }; 
      }
      
      const res = await axios.patch(url, payload, { headers });
      return res.data;
    }

    if (action === 'post') {
        const url = `${baseUrl}:runQuery?key=${apiKey}`;
        const res = await axios.post(url, queryPayload, { headers });
        return res.data;
    }
  } catch (error: any) {
    console.error(`REST Firestore ${action} failed for ${collection}:`, error.response?.data || error.message);
    throw error;
  }
}

// Helper to convert JS Object to REST Fields
function toRestFields(data: any) {
  if (!data) return {};
  const fields: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'boolean') fields[key] = { booleanValue: val };
    else if (typeof val === 'number') fields[key] = { doubleValue: val };
    else if (val instanceof admin.firestore.Timestamp) fields[key] = { timestampValue: val.toDate().toISOString() };
    else if (val instanceof Date) fields[key] = { timestampValue: val.toISOString() };
    else if (typeof val === 'string') fields[key] = { stringValue: val };
    else if (Array.isArray(val)) fields[key] = { arrayValue: { values: val.map(v => ({ stringValue: String(v) })) } };
    else if (typeof val === 'object' && val !== null) fields[key] = { mapValue: { fields: toRestFields(val) } };
  }
  return fields;
}

// Convert REST Document to JS Object
function fromRest(doc: any) {
  if (!doc || !doc.fields) return null;
  const data: any = { id: doc.name?.split('/').pop() };
  for (const [key, val] of Object.entries(doc.fields)) {
    const v: any = val;
    data[key] = v.stringValue ?? v.booleanValue ?? v.doubleValue ?? v.integerValue ?? v.timestampValue ?? v.mapValue?.fields ? fromRest({ fields: v.mapValue.fields }) : v.arrayValue?.values?.map((iv: any) => iv.stringValue);
  }
  return data;
}

// Helper for backend safe write with backups (Admin SDK First)
async function backendSafeWrite(collectionName: string, documentId: string, data: any, action: 'update' | 'create' | 'delete', performedBy: string = 'system') {
  try {
    const now = new Date().toISOString();
    
    if (db) {
       const docRef = documentId ? db.collection(collectionName).doc(documentId) : db.collection(collectionName).doc();
       const finalId = docRef.id;

       // 1. Backup before modification
       if (action === 'update' || action === 'delete') {
         const docSnap = await docRef.get();
         if (docSnap.exists) {
           const backupId = `back_${Date.now()}_${Math.random().toString(36).substring(7)}`;
           await db.collection(`${collectionName}_backup`).doc(backupId).set({
             originalId: finalId,
             collectionName,
             data: docSnap.data(),
             action,
             timestamp: admin.firestore.FieldValue.serverTimestamp(),
             performedBy
           });
         }
       }

       // 2. Write
       if (action === 'delete') {
         await docRef.set({ isDeleted: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
       } else if (action === 'update') {
         await docRef.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
       } else {
         await docRef.set({ 
           ...data, 
           createdAt: admin.firestore.FieldValue.serverTimestamp(),
           updatedAt: admin.firestore.FieldValue.serverTimestamp() 
         });
       }
       return true;
    }

    // Fallback logic (original REST implementation)
    // Backup before modification (for update and delete)
    if (action === 'update' || action === 'delete') {
      try {
        const docSnap = await restFirestore('get', collectionName, documentId);
        if (docSnap) {
          const backupId = `back_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          await restFirestore('patch', `${collectionName}_backup`, backupId, {
            originalId: documentId,
            collectionName,
            data: fromRest(docSnap),
            action,
            timestamp: now,
            performedBy
          });
        }
      } catch (e) {
        console.warn(`REST Backup failed for ${collectionName}/${documentId}, continuing write...`);
      }
    }

    if (action === 'delete') {
      await restFirestore('patch', collectionName, documentId, { isDeleted: true, deletedAt: now, updatedAt: now });
    } else if (action === 'update') {
      await restFirestore('patch', collectionName, documentId, { ...data, updatedAt: now });
    } else {
      await restFirestore('patch', collectionName, documentId, { ...data, createdAt: now, updatedAt: now });
    }
    return true;
  } catch (error: any) {
    console.error(`backendSafeWrite failed for ${collectionName}:`, error.message);
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
    } catch (e) {}

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
    console.error(`Backend REST Rollback failed for ${collectionName}/${documentId}:`, error.message);
    throw error;
  }
}

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

  // Consolidated robots.txt and sitemap.xml logic
  app.get("/robots.txt", (req, res) => {
    const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`;
    res.type('text/plain');
    res.send(robots);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const host = `${req.protocol}://${req.get('host')}`;
      
      const queryPayloadBlogs = { structuredQuery: { from: [{ collectionId: 'blogs' }], where: { fieldFilter: { field: { fieldPath: 'published' }, op: 'EQUAL', value: { booleanValue: true } } } } };
      const blogsRes = await restFirestore('post', 'blogs', undefined, undefined, queryPayloadBlogs);
      
      const queryPayloadUsers = { structuredQuery: { from: [{ collectionId: 'users' }], where: { fieldFilter: { field: { fieldPath: 'isDeleted' }, op: 'EQUAL', value: { booleanValue: false } } } } };
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
    <lastmod>${new Date(blog.updatedAt || blog.createdAt).toISOString().split('T')[0]}</lastmod>
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

  // Consolidated /api/upload with better folder mapping
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      if (!bucket) return res.status(500).json({ error: "Storage bucket not initialized" });

      const { userId, pathType } = req.body;
      const file = req.file;
      
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${randomStr}_${safeFileName}`;
      
      const folderMap: any = {
        profiles: 'profile-images',
        covers: 'cover-images',
        backgrounds: 'background-images',
        products: 'shop-images',
        blogs: 'blog-images',
        'link-icons': 'link-icons'
      };
      
      const folder = folderMap[pathType] || 'misc';
      const destination = `${folder}/${userId || 'system'}/${filename}`;
      
      const fileRef = bucket.file(destination);
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        }
      });
      
      const encodedPath = encodeURIComponent(destination);
      const publicUrl = `https://firebasestorage.googleapis.com/v1/b/${bucket.name}/o/${encodedPath}?alt=media`;
      
      console.log(`[Upload Proxy] Success: ${publicUrl}`);
      res.json({ url: publicUrl });
    } catch (error: any) {
      console.error("Backend upload failed:", error);
      res.status(500).json({ error: error.message });
    }
  });


  app.post("/api/track", async (req, res) => {
    try {
      const { collection: collectionName, id, field } = req.body;
      if (!collectionName || !id || !field) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const docRef = db.collection(collectionName).doc(id);
      await docRef.update({ [field]: admin.firestore.FieldValue.increment(1) });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/rollback", async (req, res) => {
    try {
      const { collectionName, documentId, backupId } = req.body;
      const success = await rollbackDocument(collectionName, documentId, backupId);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/verify-paystack", async (req, res) => {
    const { reference, userId, plan, isVerification, isOrder } = req.body;
    console.log(`Verifying Paystack transaction: ${reference} for user: ${userId}`);
    
    try {
      if (!PAYSTACK_SECRET_KEY) {
        throw new Error("Paystack Secret Key is missing.");
      }

      const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      });
      const paystackData = response.data.data;

      if (paystackData.status === 'success') {
        const amount = (paystackData.amount / 100);
        
        await db.collection('transactions').add({
          userId: userId || 'guest',
          reference: reference,
          paystack_id: paystackData.id,
          amount,
          plan: isVerification ? 'verification' : (isOrder ? 'order' : (plan || 'pro')),
          status: 'success',
          createdAt: new Date().toISOString()
        });

        if (isVerification && userId) {
          await backendSafeWrite('users', userId, { isVerified: true }, 'update', 'paystack-verify');
        } else if (!isOrder && userId) {
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
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Subscription Expiry Logic
  app.post("/api/cron/check-subscriptions", async (req, res) => {
    const now = new Date().toISOString();
    try {
      console.log('Running subscription expiry check via REST API fallback...');
      
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
      
      const results = await restFirestore('post', 'users', undefined, undefined, queryPayload);
      console.log(`REST Query found ${results.length} potential premium users`);

      let expiredCount = 0;
      for (const result of results) {
        if (!result.document) continue;
        
        const data = fromRest(result.document);
        const expired = data.premiumUntil && data.premiumUntil < now;
        
        if (expired) {
          console.log(`Expiring user ${data.id}`);
          await backendSafeWrite('users', data.id, {
            isPremium: false,
            subscriptionStatus: 'inactive',
            plan: 'basic'
          }, 'update', 'cron-expiry');
          expiredCount++;
        }
      }
      
      console.log(`✅ Successfully processed ${expiredCount} expired subscriptions via REST`);
      res.json({ status: 'success', count: expiredCount });
    } catch (error: any) {
      console.error('❌ REST Subscription expiry check failed:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Migration Endpoint
  app.post("/api/admin/migrate-users", async (req, res) => {
    try {
      const usersSnap = await db.collection('users').get();
      const batch = db.batch();
      let count = 0;

      usersSnap.forEach((doc: any) => {
        const data = doc.data();
        const updates: any = {};
        
        if (data.isDeleted === undefined) updates.isDeleted = false;
        if (!data.role) updates.role = 'user';
        if (!data.status) updates.status = 'active';
        if (data.onboardingCompleted === undefined) updates.onboardingCompleted = true;

        if (data.email === 'vickthorden@gmail.com' && data.role !== 'admin') {
          updates.role = 'admin';
        }

        if (Object.keys(updates).length > 0) {
          batch.update(doc.ref, updates);
          count++;
        }
      });

      if (count > 0) {
        await batch.commit();
      }

      res.json({ status: 'success', migratedCount: count });
    } catch (error: any) {
      console.error('Migration error:', error);
      res.status(500).json({ status: 'error', message: error.message });
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
    const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');

    app.use(express.static(distPath, { index: false }));

    app.get('*', async (req, res) => {
      try {
        let html = indexHtml;
        const url = req.url;

        // Custom SEO Injection
        if (url.startsWith('/blog/')) {
          const slug = url.split('/')[2];
          const queryPayload = {
            structuredQuery: {
              from: [{ collectionId: 'blogs' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'slug' },
                  op: 'EQUAL',
                  value: { stringValue: slug }
                }
              }
            }
          };
          const results = await restFirestore('post', 'blogs', undefined, undefined, queryPayload);
          if (results.length > 0 && results[0].document) {
            const post = fromRest(results[0].document);
            const title = post.seoTitle || post.title;
            const description = post.seoDescription || post.excerpt;
            const image = post.coverImage || "https://chipng.com/og-image.png";

            html = html
              .replace(/<title>.*?<\/title>/, `<title>${title} | Chip NG</title>`)
              .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`)
              .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title} | Chip NG" />`)
              .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`)
              .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${image}" />`)
              .replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${title} | Chip NG" />`)
              .replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${description}" />`)
              .replace(/<meta property="twitter:image" content=".*?" \/>/, `<meta property="twitter:image" content="${image}" />`);
          }
        } else if (!url.includes('.') && url.length > 2) {
          // Assume it's a profile
          const username = url.slice(1).split('/')[0];
          const queryPayload = {
            structuredQuery: {
              from: [{ collectionId: 'users' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'username' },
                  op: 'EQUAL',
                  value: { stringValue: username }
                }
              }
            }
          };
          const results = await restFirestore('post', 'users', undefined, undefined, queryPayload);
          if (results.length > 0 && results[0].document) {
            const profile = fromRest(results[0].document);
            const title = `${profile.displayName || profile.username}'s Chip NG Profile`;
            const description = profile.bio || `Connect with ${profile.displayName} on Chip NG. The only link you'll ever need.`;
            const image = profile.photoURL || "https://chipng.com/og-image.png";

            html = html
              .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
              .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`)
              .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`)
              .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`)
              .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${image}" />`);
          }
        }

        res.send(html);
      } catch (err) {
        res.send(indexHtml);
      }
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
