import { GoogleAuth } from 'google-auth-library';

async function checkIdentity() {
    try {
        const auth = new GoogleAuth();
        const client = await auth.getClient();
        const projectId = await auth.getProjectId();
        console.log("Current Project ID:", projectId);
        
        // Try to get service account email if possible
        const credentials = await auth.getCredentials();
        console.log("Service Account Email:", (credentials as any).client_email || 'Default');
        
        // Scope test
        console.log("Scopes:", (client as any).scopes || 'None');
    } catch (error: any) {
        console.error("Identity Check Failed:", error.message);
    }
}

checkIdentity();
