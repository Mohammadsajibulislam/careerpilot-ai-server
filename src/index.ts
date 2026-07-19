import "dotenv/config";

import express, { Application, Request, Response } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import jobsRouter from "./routes/jobs";
import profileRouter from "./routes/profile";
import matchRouter from "./routes/match";

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("CareerPilot AI server is running");
});

app.use("/api/jobs", jobsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/match", matchRouter);

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