import { Router, Response } from "express";
import { getDB } from "../config/db.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";

const router = Router();

// GET /api/profile — protected, নিজের profile fetch
router.get("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDB();
    const profile = await db.collection("profiles").findOne({ userId: req.user?.id });
    // Older/partially-created profiles may be missing fields; always return the full shape.
    res.json({
      userId: req.user?.id,
      resumeText: typeof profile?.resumeText === "string" ? profile.resumeText : "",
      skills: Array.isArray(profile?.skills) ? profile.skills : [],
      resumeFileName: profile?.resumeFileName ?? "",
      updatedAt: profile?.updatedAt,
    });
  } catch (error) {
    console.error("GET /profile error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// PUT /api/profile — protected, upsert (create or update)
router.put("/", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { resumeText, skills } = req.body;
    if (typeof resumeText !== "string" || !Array.isArray(skills)) {
      return res.status(400).json({ message: "resumeText must be a string and skills must be an array" });
    }

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