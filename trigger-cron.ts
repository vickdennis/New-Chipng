import axios from 'axios';

async function triggerCron() {
    try {
        console.log("Triggering subscription check...");
        const res = await axios.post('http://localhost:3000/api/cron/check-subscriptions');
        console.log("Result:", JSON.stringify(res.data, null, 2));
    } catch (error: any) {
        if (error.response) {
            console.error("Failed with status:", error.response.status);
            console.error("Error Body:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

triggerCron();
