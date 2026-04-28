import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function testRestIdentical() {
    try {
        const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const { projectId, firestoreDatabaseId, apiKey } = config;

        const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents`;
        const headers = {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json'
        };

        console.log("Testing REST API Identical to server.ts...");
        const url = `${baseUrl}/users`;
        const res = await axios.get(url, { headers });
        
        console.log("REST Success!");
        console.log("Documents:", res.data.documents?.length || 0);
    } catch (error: any) {
        if (error.response) {
            console.error("REST Failed with status:", error.response.status);
            console.error("Error Body:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testRestIdentical();
