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
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));
app.all("/api/auth/*splat", (0, node_1.toNodeHandler)(auth_1.auth));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("CareerPilot AI server is running");
});
app.use("/api/jobs", jobs_1.default);
async function startServer() {
    try {
        await (0, db_1.connectDB)();
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Server start করতে ব্যর্থ:", error);
        process.exit(1);
    }
}
startServer();
