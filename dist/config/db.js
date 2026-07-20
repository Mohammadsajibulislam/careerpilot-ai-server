import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
if (!uri) {
    throw new Error("❌ MONGODB_URI .env ফাইলে পাওয়া যায়নি");
}
if (!dbName) {
    throw new Error("❌ DB_NAME .env ফাইলে পাওয়া যায়নি");
}
const client = new MongoClient(uri);
let db;
export async function connectDB() {
    if (db)
        return db; // already connected, reuse
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ MongoDB connected: ${dbName}`);
    return db;
}
export function getDB() {
    if (!db) {
        throw new Error("❌ Database এখনো connect হয়নি — আগে connectDB() call করো");
    }
    return db;
}
