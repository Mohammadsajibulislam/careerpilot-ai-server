import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const authUri = process.env.MONGODB_URI;
const authDbName = process.env.AUTH_DB_NAME;

if (!authUri) throw new Error("❌ MONGODB_URI .env ফাইলে পাওয়া যায়নি");
if (!authDbName) throw new Error("❌ AUTH_DB_NAME .env ফাইলে পাওয়া যায়নি");

const authClient = new MongoClient(authUri);
const authDb = authClient.db(authDbName);

export const auth = betterAuth({
  database: mongodbAdapter(authDb),
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
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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