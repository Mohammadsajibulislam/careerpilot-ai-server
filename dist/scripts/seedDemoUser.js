import "dotenv/config";
import { auth } from "../lib/auth.js";
async function seedDemoUser() {
    try {
        const result = await auth.api.signUpEmail({
            body: {
                name: "Demo User",
                email: "demo@careerpilot.ai",
                password: "demo123456",
            },
        });
        console.log("✅ Demo user created:", result.user.email);
    }
    catch (error) {
        if (error.message?.includes("already exists") || error.status === 422) {
            console.log("ℹ️ Demo user already exists — skipping");
        }
        else {
            console.error("❌ Failed to seed demo user:", error);
        }
    }
    process.exit(0);
}
seedDemoUser();
