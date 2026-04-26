import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function runDiag() {
  console.log("🔍 --- STARTING FIREBASE ADMIN DIAGNOSTICS ---");

  // Log Environment
  console.log("🌍 Environment Variables:");
  console.log("GOOGLE_APPLICATION_CREDENTIALS:", process.env.GOOGLE_APPLICATION_CREDENTIALS || "undefined");
  console.log("GOOGLE_CLOUD_PROJECT:", process.env.GOOGLE_CLOUD_PROJECT || "undefined");
  console.log("GCLOUD_PROJECT:", process.env.GCLOUD_PROJECT || "undefined");
  console.log("FIRESTORE_DATABASE:", process.env.FIRESTORE_DATABASE || "undefined");

  // Load Config
  let firebaseConfig: any = null;
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log("📄 Config Found:", firebaseConfig);
  } else {
    console.log("❌ firebase-applet-config.json NOT FOUND");
  }

  async function testInit(name: string, options: admin.AppOptions, dbId?: string) {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`Options:`, options);
    console.log(`Database ID:`, dbId || "(default)");

    try {
      // Create unique name for each test
      const appName = `app-${Math.random().toString(36).substring(7)}`;
      const app = admin.initializeApp(options, appName);
      
      console.log(`✅ App initialized. Project ID in app.options: ${app.options.projectId}`);
      
      const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
      console.log(`📡 Attempting to check health of ${dbId || '(default)'}...`);
      
      // Use listCollections as it is a more reliable connectivity test than a single doc read if permissions are higher
      const collections = await db.listCollections();
      console.log(`✅ Success! Found ${collections.length} collections.`);
      
      return true;
    } catch (e: any) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`Error Message: ${e.message}`);
      console.log(`Error Code: ${e.code}`);
      return false;
    }
  }

  // Strategy 1: Default
  await testInit("Default Init", {});

  // Strategy 2: Explicit Project from Config
  if (firebaseConfig?.projectId) {
    await testInit("Explicit Project", { 
        projectId: firebaseConfig.projectId,
        credential: admin.credential.applicationDefault()
    });
    
    // Strategy 3: Explicit Project + Database
    if (firebaseConfig?.firestoreDatabaseId) {
      await testInit("Explicit Project + DB", { 
          projectId: firebaseConfig.projectId,
          credential: admin.credential.applicationDefault()
      }, firebaseConfig.firestoreDatabaseId);
    }
  }

  // Strategy 5: Static initialization style (no app passed)
  if (firebaseConfig?.firestoreDatabaseId) {
      console.log(`\n🧪 Testing: Static initializationstyle`);
      try {
        const db = getFirestore(firebaseConfig.firestoreDatabaseId);
        const collections = await db.listCollections();
        console.log(`✅ Success (Static)! Found ${collections.length} collections.`);
      } catch (e: any) {
        console.log(`❌ FAILED: Static initialization`);
        console.log(`Error Message: ${e.message}`);
      }
  }

  console.log("\n🏁 --- DIAGNOSTICS COMPLETE ---");
}

runDiag().catch(console.error);
