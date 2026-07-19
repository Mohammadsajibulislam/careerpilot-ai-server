import { Router, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db";
import { ai, GEMINI_MODEL } from "../lib/gemini";
import { verifyToken, AuthRequest } from "../middleware/verifyToken";

const router = Router();

interface MatchResult {
  score: number;
  reasons: string[];
  gaps: string[];
}

// POST /api/match/:jobId — protected, generates AI match score for one job
router.post("/:jobId", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;

    if (Array.isArray(jobId) || !ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const db = getDB();

    const [job, profile] = await Promise.all([
      db.collection("jobs").findOne({ _id: new ObjectId(jobId) }),
      db.collection("profiles").findOne({ userId: req.user?.id }),
    ]);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!profile || (!profile.resumeText && profile.skills?.length === 0)) {
      return res.status(400).json({
        message: "Add your skills and resume summary in your profile first",
      });
    }

    const prompt = `You are a job-matching assistant. Compare this candidate profile against this job and return a match analysis.

CANDIDATE SKILLS: ${profile.skills.join(", ") || "none listed"}
CANDIDATE BACKGROUND: ${profile.resumeText || "none provided"}

JOB TITLE: ${job.title}
JOB CATEGORY: ${job.category}
JOB REQUIREMENTS: ${job.requirements?.join(", ") || "none listed"}
JOB DESCRIPTION: ${job.description}

Return a match score from 0-100, 2-4 short reasons why it matches, and 0-3 short gaps (missing skills/experience). Keep every string under 15 words.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            reasons: { type: "array", items: { type: "string" } },
            gaps: { type: "array", items: { type: "string" } },
          },
          required: ["score", "reasons", "gaps"],
        },
      },
    });

    const result: MatchResult = JSON.parse(response.text || "{}");

    // cache করে রাখছি, বারবার একই job-এর জন্য AI call না করার জন্য
    await db.collection("matches").updateOne(
      { userId: req.user?.id, jobId: jobId },
      { $set: { ...result, userId: req.user?.id, jobId, createdAt: new Date() } },
      { upsert: true }
    );

    res.json(result);
  } catch (error) {
    console.error("POST /match/:jobId error:", error);
    res.status(500).json({ message: "Failed to generate match score" });
  }
});

// GET /api/match/:jobId — protected, cached result থাকলে সেটা ফেরত দেয়
router.get("/:jobId", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;

    if (Array.isArray(jobId) || !ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const db = getDB();
    const match = await db.collection("matches").findOne({ userId: req.user?.id, jobId });

    if (!match) {
      return res.status(404).json({ message: "No match generated yet" });
    }

    res.json(match);
  } catch (error) {
    console.error("GET /match/:jobId error:", error);
    res.status(500).json({ message: "Failed to fetch match" });
  }
});

export default router;