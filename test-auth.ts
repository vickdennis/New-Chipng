import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

async function testAuth() {
    try {
        const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        if (!admin.apps.length) {
            admin.initializeApp({ projectId: config.projectId });
        }
        
        console.log("Listing users (Auth)...");
        const listUsers = await admin.auth().listUsers(1);
        console.log("Auth Success! Users count:", listUsers.users.length);
    } catch (error: any) {
        console.error("Auth Failed:", error.message);
    }
}

testAuth();
