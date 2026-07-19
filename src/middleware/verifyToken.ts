import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth";
import { fromNodeHeaders } from "better-auth/node";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export async function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
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
      role: (session.user as { role?: string }).role || "user",
    };

    next();
  } catch (error) {
    console.error("verifyToken error:", error);
    res.status(401).json({ message: "Invalid session" });
  }
}