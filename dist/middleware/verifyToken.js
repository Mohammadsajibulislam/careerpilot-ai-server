import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
export async function verifyToken(req, res, next) {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });
        if (!session) {
            return res.status(401).json({ message: "Unauthorized — please sign in" });
        }
        req.user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role || "user",
        };
        next();
    }
    catch (error) {
        console.error("verifyToken error:", error);
        res.status(401).json({ message: "Invalid session" });
    }
}
