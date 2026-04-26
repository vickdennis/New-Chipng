import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function testRestWithToken() {
    try {
        const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const { projectId, firestoreDatabaseId } = config;

        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });
        const client = await auth.getClient();
        const token = await client.getAccessToken();
        
        console.log("Testing REST API with Service Account Token...");
        
        // Try to GET a sample user
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/users`;
        const res = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token.token}`
            }
        });
        
        console.log("REST with Token Success!");
        console.log("Documents Count:", res.data.documents?.length || 0);
    } catch (error: any) {
        if (error.response) {
            console.error("REST with Token Failed with status:", error.response.status);
            console.error("Error Body:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testRestWithToken();
