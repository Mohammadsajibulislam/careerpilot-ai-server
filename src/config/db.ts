import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

if (!uri) {
  throw new Error("❌ MONGODB_URI .env ফাইলে পাওয়া যায়নি");
}
if (!dbName) {
  throw new Error("❌ DB_NAME .env ফাইলে পাওয়া যায়নি");
}

const client = new MongoClient(uri);

let db: Db;

async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection("jobs").createIndex({ postedBy: 1 }),
    db.collection("jobs").createIndex({ category: 1 }),
    db.collection("jobs").createIndex({ status: 1 }),
    db.collection("jobs").createIndex({ createdAt: -1 }),
    db.collection("matches").createIndex({ userId: 1, jobId: 1 }),
    db.collection("chatSessions").createIndex({ userId: 1, jobId: 1 }),
    db.collection("reviews").createIndex({ jobId: 1 }),
    db.collection("profiles").createIndex({ userId: 1 }),
  ]);
}

export async function connectDB(): Promise<Db> {
  if (db) return db; // already connected, reuse

  await client.connect();
  db = client.db(dbName);
  await ensureIndexes(db);
  console.log(`✅ MongoDB connected: ${dbName}`);
  return db;
}

export function getDB(): Db {
  if (!db) {
    throw new Error("❌ Database এখনো connect হয়নি — আগে connectDB() call করো");
  }
  return db;
}