import { Router, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDB } from "../config/db.js";
import { client, AI_MODEL } from "../lib/ai.js";
import { extractJsonObject } from "../lib/parseAiJson.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";
import { aiLimiter } from "../middleware/rateLimit.js";

const router = Router();

const matchResultSchema = z.object({
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()),
  gaps: z.array(z.string()),
});

// POST /api/match/:jobId — protected, generates AI match score for one job
router.post("/:jobId", aiLimiter, async (req: AuthRequest, res: Response) => {
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

    if (!profile || (!profile.resumeText && !profile.skills?.length)) {
      return res.status(400).json({
        message: "Add your skills and resume summary in your profile first",
      });
    }

    const prompt = `You are a job-matching assistant. Compare this candidate profile against this job and return a match analysis.

CANDIDATE SKILLS: ${profile.skills?.join(", ") || "none listed"}
CANDIDATE BACKGROUND: ${profile.resumeText || "none provided"}

JOB TITLE: ${job.title}
JOB CATEGORY: ${job.category}
JOB REQUIREMENTS: ${job.requirements?.join(", ") || "none listed"}
JOB DESCRIPTION: ${job.description}

Return a JSON object with score (0-100), reasons (array of strings), and gaps (array of strings). Keep every string under 15 words.`;

    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0]?.message?.content || "";
    const parsed = extractJsonObject(text);

    let result: z.infer<typeof matchResultSchema>;
    try {
      result = matchResultSchema.parse(parsed);
    } catch {
      return res.status(502).json({
        message: "The AI returned an unexpected response — please try again",
      });
    }

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
router.get("/:jobId", async (req: AuthRequest, res: Response) => {
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
