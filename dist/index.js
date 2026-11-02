import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import { auth } from "./lib/auth.js";
import { toNodeHandler } from "better-auth/node";
import { isOriginAllowed } from "./lib/origins.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import jobsRouter from "./routes/jobs.js";
import profileRouter from "./routes/profile.js";
import matchRouter from "./routes/match.js";
import interviewChatRouter from "./routes/interviewChat.js";
import statsRouter from "./routes/stats.js";
import reviewsRouter from "./routes/reviews.js";
import coverLetterRouter from "./routes/coverLetter.js";
import uploadRouter from "./routes/upload.js";
const app = express();
// Vercel terminates TLS and forwards the client IP via X-Forwarded-For/Forwarded.
// Trust the first proxy hop so req.ip and rate limiting see the real client.
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = [
    process.env.CLIENT_URL,
    "https://careerpilot-ai-client.vercel.app",
    // Deployment-specific and preview URLs for the client project.
    "https://careerpilot-ai-client-*.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
].filter(Boolean);
app.use(cors({
    origin: (origin, cb) => {
        if (!origin || isOriginAllowed(origin, allowedOrigins)) {
            cb(null, true);
        }
        else {
            const err = new Error("Not allowed by CORS");
            err.statusCode = 403;
            cb(err);
        }
    },
    credentials: true,
}));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use("/api", apiLimiter);
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
// 404 for unknown routes
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});
// Global error handler
app.use((err, _req, res, _next) => {
    const isMulterError = typeof err.code === "string" && err.code.startsWith("LIMIT_");
    const status = isMulterError ? 400 : err.statusCode || err.status || 500;
    if (status >= 500) {
        console.error("Unhandled error:", err);
    }
    res.status(status).json({ message: status >= 500 ? "Something went wrong" : err.message });
});
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
