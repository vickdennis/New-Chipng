import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

async function listDatabases() {
    try {
        const auth = new GoogleAuth({
            scopes: 'https://www.googleapis.com/auth/cloud-platform'
        });
        const client = await auth.getClient();
        const projectId = 'gen-lang-client-0003219029';
        const token = await client.getAccessToken();
        
        console.log("Listing databases for project:", projectId);
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;
        const res = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token.token}`
            }
        });
        
        console.log("Databases:", JSON.stringify(res.data, null, 2));
    } catch (error: any) {
        if (error.response) {
            console.error("Failed with status:", error.response.status);
            console.error("Error Body:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

listDatabases();
