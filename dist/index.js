"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./config/db");
const auth_1 = require("./lib/auth");
const node_1 = require("better-auth/node");
const jobs_1 = __importDefault(require("./routes/jobs"));
const profile_1 = __importDefault(require("./routes/profile"));
const match_1 = __importDefault(require("./routes/match"));
const interviewChat_1 = __importDefault(require("./routes/interviewChat"));
const stats_1 = __importDefault(require("./routes/stats"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));
app.all("/api/auth/*splat", (0, node_1.toNodeHandler)(auth_1.auth));
app.use(express_1.default.json());
// lazily connect to DB on first request (works in serverless)
let dbConnected = false;
app.use(async (_req, _res, next) => {
    if (!dbConnected) {
        try {
            await (0, db_1.connectDB)();
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
app.use("/api/jobs", jobs_1.default);
app.use("/api/profile", profile_1.default);
app.use("/api/match", match_1.default);
app.use("/api/interview-chat", interviewChat_1.default);
app.use("/api/stats", stats_1.default);
// Only start the server when running directly (not on Vercel serverless)
const isServerless = process.env.VERCEL === "1";
if (!isServerless) {
    const PORT = process.env.PORT || 5000;
    (async () => {
        try {
            await (0, db_1.connectDB)();
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
exports.default = app;
