import { Router, Response } from "express";
import { getDB } from "../config/db.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";

const router = Router();

// GET /api/profile — protected, নিজের profile fetch
router.get("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDB();
    const profile = await db.collection("profiles").findOne({ userId: req.user?.id });
    res.json(profile || { userId: req.user?.id, resumeText: "", skills: [] });
  } catch (error) {
    console.error("GET /profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// PUT /api/profile — protected, upsert (create or update)
router.put("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { resumeText, skills } = req.body;
    const db = getDB();

    await db.collection("profiles").updateOne(
      { userId: req.user?.id },
      {
        $set: {
          userId: req.user?.id,
          resumeText: resumeText || "",
          skills: Array.isArray(skills) ? skills : [],
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({ message: "Profile updated" });
  } catch (error) {
    console.error("PUT /profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

export default router;