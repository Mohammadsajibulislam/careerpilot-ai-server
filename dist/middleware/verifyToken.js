"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
const auth_1 = require("../lib/auth");
const node_1 = require("better-auth/node");
async function verifyToken(req, res, next) {
    try {
        const session = await auth_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).json({ message: "Unauthorized — please sign in" });
        }
        req.user = {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role || "user",
        };
        next();
    }
    catch (error) {
        console.error("verifyToken error:", error);
        res.status(401).json({ message: "Invalid session" });
    }
}
