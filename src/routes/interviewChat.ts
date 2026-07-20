import { Router, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { ai, GEMINI_MODEL } from "../lib/gemini.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";

const router = Router();

router.get("/:jobId", async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    if (Array.isArray(jobId) || !ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const db = getDB();
    const session = await db.collection("chatSessions").findOne({
      userId: req.user?.id,
      jobId,
    });

    res.json({ messages: session?.messages || [] });
  } catch (error) {
    console.error("GET /interview-chat/:jobId error:", error);
    res.status(500).json({ message: "Failed to load conversation" });
  }
});

router.post("/:jobId",async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const { message } = req.body;

    if (Array.isArray(jobId) || !ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job id" });
    }
    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message is required" });
    }

    const db = getDB();
    const [job, existingSession] = await Promise.all([
      db.collection("jobs").findOne({ _id: new ObjectId(jobId) }),
      db.collection("chatSessions").findOne({ userId: req.user?.id, jobId }),
    ]);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const history = existingSession?.messages || [];

    const systemContext = `You are an interview preparation coach helping a candidate prepare for this specific role:

JOB TITLE: ${job.title}
COMPANY: ${job.company}
CATEGORY: ${job.category}
REQUIREMENTS: ${job.requirements?.join(", ") || "not specified"}
DESCRIPTION: ${job.description}

Ask relevant interview questions, give feedback on the candidate's answers, and offer specific, actionable advice. Keep responses focused and conversational, under 120 words unless asked for more detail. If this is the first message, briefly greet them and ask an opening interview question for this role.`;

    const contents = [
      { role: "user" as const, parts: [{ text: systemContext }] },
      { role: "model" as const, parts: [{ text: "Understood. I'll act as an interview coach for this role." }] },
      ...history.map((m: { role: string; text: string }) => ({
        role: m.role as "user" | "model",
        parts: [{ text: m.text }],
      })),
      { role: "user" as const, parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });

    const replyText = response.text || "Sorry, I couldn't generate a response. Please try again.";

    const newMessages = [
      ...history,
      { role: "user", text: message, timestamp: new Date() },
      { role: "model", text: replyText, timestamp: new Date() },
    ];

    await db.collection("chatSessions").updateOne(
      { userId: req.user?.id, jobId },
      {
        $set: { messages: newMessages, updatedAt: new Date() },
        $setOnInsert: { userId: req.user?.id, jobId, createdAt: new Date() },
      },
      { upsert: true }
    );

    res.json({ reply: replyText });
  } catch (error) {
    console.error("POST /interview-chat/:jobId error:", error);
    res.status(500).json({ message: "Failed to get response" });
  }
});

export default router;
