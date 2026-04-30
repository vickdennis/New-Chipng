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
import { GoogleGenerativeAI } from "@google/generative-ai";
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
        else if (typeof val === 'object' && val !== null) payload.fields[key] = { mapValue: { fields: {} } }; // Simple nested map support
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

// Helper for backend safe write with backups
async function backendSafeWrite(collectionName: string, documentId: string, data: any, action: 'update' | 'create' | 'delete', performedBy: string = 'system') {
  try {
    const now = new Date().toISOString();
    
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
    console.error(`Backend REST SafeWrite failed for ${collectionName}/${documentId}:`, error);
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

  // ==========================================
  // API ROUTES (Must be before Vite/Static)
  // ==========================================

  app.get("/api/health", async (req, res) => {
    try {
      const usersRes = await restFirestore('get', 'users');
      const count = usersRes.documents?.length || 0;
      res.json({ status: "ok", usersFound: count });
    } catch (error: any) {
      res.json({ status: "error", message: error.message });
    }
  });

  // AI Designer Proxy Endpoint
  // AI Designer Endpoint (Fixing model/key usage)
  app.post("/api/ai/design", async (req, res) => {
    try {
      const { messages, userContext } = req.body;
      const key = process.env.GEMINI_API_KEY;

      if (!key) {
        console.error("[AI Designer] Error: GEMINI_API_KEY is missing from environment");
        return res.status(500).json({ error: "AI Designer is currently unavailable. Please configure the GEMINI_API_KEY." });
      }

      // Check for potentially invalid key format (just length check)
      if (key.length < 20) {
         console.warn(`[AI Designer] Warning: GEMINI_API_KEY seems too short (${key.length}). Check configuration.`);
      }

      const systemInstruction = `
        You are the Chip NG "AI Designer", a professional profile engineer. 
        Your goal is to help users set up their perfect link-in-bio profile instantly.
        
        You can update the **Cover Image** as part of 'updateProfile'. Recommend abstract patterns or high-quality background images if users want to change their look.
        
        CURRENT CONTEXT:
        ${JSON.stringify(userContext)}

        Be helpful, creative, and efficient. 
        You have access to functions to: updateProfile, addLink, updateLink, deleteLink, applyTheme.
        
        IMPORTANT: When updating properties, use the correct field names:
        - Profiles: displayName, bio, username, textColor, photoURL, coverImage, backgroundColor, theme, font, buttonStyle.
        - Links: title, url, icon, active.
      `;

      const tools = [
        {
          functionDeclarations: [
            {
              name: "updateProfile",
              description: "Update the user's profile details like display name, bio, cover image, or username.",
              parameters: {
                type: "OBJECT",
                properties: {
                  displayName: { type: "STRING" },
                  bio: { type: "STRING" },
                  username: { type: "STRING" },
                  textColor: { type: "STRING" },
                  photoURL: { type: "STRING" },
                  coverImage: { type: "STRING" },
                  backgroundColor: { type: "STRING" },
                  theme: { type: "STRING" }
                }
              }
            },
            {
              name: "addLink",
              description: "Add a new link to the user's profile.",
              parameters: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  url: { type: "STRING" }
                },
                required: ["title", "url"]
              }
            },
            {
              name: "updateLink",
              description: "Update an existing link's title or URL.",
              parameters: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  title: { type: "STRING" },
                  url: { type: "STRING" }
                },
                required: ["id"]
              }
            },
            {
              name: "deleteLink",
              description: "Delete a link from the profile.",
              parameters: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" }
                },
                required: ["id"]
              }
            },
            {
              name: "applyTheme",
              description: "Change the visual theme of the profile.",
              parameters: {
                type: "OBJECT",
                properties: {
                  theme: { type: "STRING" }
                },
                required: ["theme"]
              }
            }
          ]
        }
      ];

      const ai = new GoogleGenerativeAI(key);
      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction,
        tools: tools as any[]
      });

      const history = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })).slice(0, -1);

      let firstUserIndex = history.findIndex((h: any) => h.role === 'user');
      const validHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];
      const lastMessage = messages[messages.length - 1].content;

      const chat = model.startChat({
        history: validHistory as any[],
        generationConfig: { 
          maxOutputTokens: 1000,
          temperature: 0.7,
        }
      });

      const result = await chat.sendMessage(lastMessage);
      const response = await result.response;
      
      let functionCalls = [];
      let text = "";

      // Improved response parsing for function calls and text
      const parts = response.candidates?.[0]?.content?.parts || [];
      
      for (const part of parts) {
        if (part.functionCall) {
          functionCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args
          });
        }
        if (part.text) {
          text += part.text;
        }
      }

      // Fallback if parts didn't work as expected
      if (functionCalls.length === 0) {
        try {
          const calls = response.functionCalls();
          if (calls && calls.length > 0) {
            functionCalls = calls;
          }
        } catch (e) {}
      }

      if (!text && functionCalls.length === 0) {
         try {
           text = response.text();
         } catch (e) {}
      }

      console.log(`[AI Designer] Generated ${functionCalls.length} function calls and ${text.length} chars of text`);

      res.json({ text, functionCalls });
    } catch (error: any) {
      console.error("AI Designer Proxy failed:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload Proxy Endpoint
  app.post("/api/upload", upload.single('file'), async (req: any, res) => {
    try {
      const file = req.file;
      const pathValue = req.body.path;

      console.log(`[Upload] Processing: ${pathValue}, Size: ${file?.size || 0}`);

      if (!file || !pathValue) {
        return res.status(400).json({ error: "Missing file or path" });
      }

      const fileRef = bucket.file(pathValue);
      await fileRef.save(file.buffer, {
        metadata: { contentType: file.mimetype }
      });
      
      // Make public or get signed URL
      // In this environment, we'll use a public URL if bucket is configured, 
      // or a signed URL. Simpler for chip-ng: 
      const url = `https://firebasestorage.googleapis.com/v1/b/${bucket.name}/o/${encodeURIComponent(pathValue)}?alt=media`;
      
      console.log(`[Upload] Success: ${url}`);
      res.json({ url });
    } catch (error: any) {
      console.error('[Upload] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Blog Writer Endpoint
  app.post("/api/ai/blog", async (req, res) => {
    try {
      const { topic } = req.body;
      const key = process.env.GEMINI_API_KEY;

      if (!key) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenerativeAI(key);
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Write a professional blog post about "${topic}". 
      Return the response in JSON format with the following keys:
      - title: A catchy title
      - content: Full blog post content in Markdown format (use proper headers, lists, etc.)
      - excerpt: A short 2-sentence summary
      - seoTitle: SEO optimized title (max 60 chars)
      - seoDescription: SEO optimized description (max 160 chars)
      - seoKeywords: Array of 5-10 relevant keywords
      - tags: Array of 3-5 relevant tags
      
      IMPORTANT: Respond ONLY with valid JSON. No markdown backticks.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up potential markdown blocks if AI ignored instructions
      text = text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      }

      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (parseError) {
        console.error("Failed to parse AI blog response:", text);
        res.status(500).json({ error: "Failed to parse AI response as JSON", raw: text });
      }
    } catch (error: any) {
      console.error("AI Blog Writer failed:", error.message);
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

  // 4. SEO Endpoints
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Sitemap: https://chipng.com/sitemap.xml`);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const blogPosts = await restFirestore('get', 'blogs');
      const profiles = await restFirestore('get', 'users');
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://chipng.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://chipng.com/blog</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://chipng.com/pricing</loc>
    <priority>0.7</priority>
  </url>`;

      blogPosts.forEach((post: any) => {
        const data = fromRest(post);
        if (data.slug) {
          xml += `
  <url>
    <loc>https://chipng.com/blog/${data.slug}</loc>
    <lastmod>${new Date(data.updatedAt || data.createdAt).toISOString().split('T')[0]}</lastmod>
    <priority>0.6</priority>
  </url>`;
        }
      });

      profiles.forEach((profile: any) => {
        const data = fromRest(profile);
        if (data.username && !data.isDeleted) {
          xml += `
  <url>
    <loc>https://chipng.com/${data.username}</loc>
    <priority>0.5</priority>
  </url>`;
        }
      });

      xml += `\n</urlset>`;
      res.type("application/xml");
      res.send(xml);
    } catch (error) {
      res.status(500).send("Error generating sitemap");
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
