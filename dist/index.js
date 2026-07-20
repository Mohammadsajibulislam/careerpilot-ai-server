import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import { auth } from "./lib/auth.js";
import { toNodeHandler } from "better-auth/node";
import jobsRouter from "./routes/jobs.js";
import profileRouter from "./routes/profile.js";
import matchRouter from "./routes/match.js";
import interviewChatRouter from "./routes/interviewChat.js";
import statsRouter from "./routes/stats.js";
import reviewsRouter from "./routes/reviews.js";
import coverLetterRouter from "./routes/coverLetter.js";
import uploadRouter from "./routes/upload.js";
const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = [
    process.env.CLIENT_URL,
    "https://careerpilot-ai-client.vercel.app",
    "http://localhost:3000",
].filter(Boolean);
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
            cb(null, true);
        }
        else {
            cb(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
// lazily connect to DB on first request (works in serverless)
let dbConnected = false;
app.use(async (_req, _res, next) => {
    if (!dbConnected) {
        try {
            await connectDB();
            dbConnected = true;
        }
        catch (error) {
            console.error("DB connection failed:", error);
        }
    }
    next();
});
app.get("/", (req, res) => {
    res.send("CareerPilot AI server is running");
});
app.use("/api/jobs", jobsRouter);
app.use("/api/profile", profileRouter);
app.use("/api/match", matchRouter);
app.use("/api/interview-chat", interviewChatRouter);
app.use("/api/stats", statsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/cover-letter", coverLetterRouter);
app.use("/api/upload", uploadRouter);
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
        }
        catch (error) {
            console.error("❌ Server start করতে ব্যর্থ:", error);
            process.exit(1);
        }
    })();
}
export default app;
