import "dotenv/config"; 

import express, { Application, Request, Response } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";

const app: Application = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Better Auth route — express.json() এর আগে
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("CareerPilot AI server is running");
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server start করতে ব্যর্থ:", error);
    process.exit(1);
  }
}

startServer();