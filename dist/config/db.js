"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.getDB = getDB;
const mongodb_1 = require("mongodb");
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
if (!uri) {
    throw new Error("❌ MONGODB_URI .env ফাইলে পাওয়া যায়নি");
}
if (!dbName) {
    throw new Error("❌ DB_NAME .env ফাইলে পাওয়া যায়নি");
}
const client = new mongodb_1.MongoClient(uri);
let db;
async function connectDB() {
    if (db)
        return db; // already connected, reuse
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ MongoDB connected: ${dbName}`);
    return db;
}
function getDB() {
    if (!db) {
        throw new Error("❌ Database এখনো connect হয়নি — আগে connectDB() call করো");
    }
    return db;
}
