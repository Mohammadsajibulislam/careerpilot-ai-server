import "dotenv/config";

import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import jobsRouter from "./routes/jobs";
import profileRouter from "./routes/profile";
import matchRouter from "./routes/match";
import interviewChatRouter from "./routes/interviewChat";
import statsRouter from "./routes/stats";

const app: Application = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// lazily connect to DB on first request (works in serverless)
let dbConnected = false;
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      console.error("DB connection failed:", error);
    }
  }
  next();
});

app.get("/", (req: Request, res: Response) => {
  res.send("CareerPilot AI server is running");
});

app.use("/api/jobs", jobsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/match", matchRouter);
app.use("/api/interview-chat", interviewChatRouter);
app.use("/api/stats", statsRouter);

// Only start the server when running directly (not on Vercel serverless)
const isServerless = process.env.VERCEL === "1";
if (!isServerless) {
  const PORT = process.env.PORT || 5000;
  (async () => {
    try {
      await connectDB();
      dbConnected = true;
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error("❌ Server start করতে ব্যর্থ:", error);
      process.exit(1);
    }
  })();
}

export default app;