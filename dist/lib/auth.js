"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const mongodb_1 = require("better-auth/adapters/mongodb");
const mongodb_2 = require("mongodb");
const authUri = process.env.MONGODB_URI;
const authDbName = process.env.AUTH_DB_NAME;
if (!authUri)
    throw new Error("❌ MONGODB_URI .env ফাইলে পাওয়া যায়নি");
if (!authDbName)
    throw new Error("❌ AUTH_DB_NAME .env ফাইলে পাওয়া যায়নি");
const authClient = new mongodb_2.MongoClient(authUri);
const authDb = authClient.db(authDbName);
exports.auth = (0, better_auth_1.betterAuth)({
    database: (0, mongodb_1.mongodbAdapter)(authDb),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    account: {
        accountLinking: {
            requireLocalEmailVerified: false,
        },
        storeStateStrategy: "database",
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],
});
