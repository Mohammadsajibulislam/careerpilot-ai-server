import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
const authUri = process.env.MONGODB_URI;
const authDbName = process.env.AUTH_DB_NAME;
if (!authUri)
    throw new Error("❌ MONGODB_URI .env ফাইলে পাওয়া যায়নি");
if (!authDbName)
    throw new Error("❌ AUTH_DB_NAME .env ফাইলে পাওয়া যায়নি");
const authClient = new MongoClient(authUri);
const authDb = authClient.db(authDbName);
const authBaseURL = process.env.BETTER_AUTH_URL || "http://localhost:5000";
// Cross-site cookies (client and API on different hosts) require SameSite=None + Secure.
// Over plain HTTP (local dev) those attributes would make the browser drop the cookie.
const isHttps = authBaseURL.startsWith("https://");
export const auth = betterAuth({
    database: mongodbAdapter(authDb),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: authBaseURL,
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    account: {
        accountLinking: {
            // Allow signing in with Google even when the same email already exists
            // as an email/password account (Google verifies emails).
            enabled: true,
            trustedProviders: ["google"],
            requireLocalEmailVerified: false,
        },
        storeStateStrategy: "database",
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Must be registered as an "Authorized redirect URI" in Google Cloud Console.
            redirectURI: process.env.GOOGLE_REDIRECT_URI,
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user",
                input: true,
            },
        },
    },
    trustedOrigins: [
        process.env.CLIENT_URL,
        "https://careerpilot-ai-client.vercel.app",
        "https://careerpilot-ai-client-*.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ].filter(Boolean),
    advanced: {
        defaultCookieAttributes: {
            sameSite: isHttps ? "none" : "lax",
            secure: isHttps,
        },
    },
});
