import { Router, Response } from "express";
import { ai, GEMINI_MODEL } from "../lib/gemini.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import { coverLetterSchema } from "../validators/job.js";

const router = Router();

router.post("/", verifyToken, validate(coverLetterSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { company, role, skills, tone } = req.body;

    if (!company || !role) {
      return res.status(400).json({ message: "Company and role are required" });
    }

    const prompt = `You are a professional cover letter writer. Write a ${tone || "professional"} cover letter for a ${role} position at ${company}.
${skills ? `The applicant's key skills: ${skills}.` : ""}
Keep it concise (3-4 paragraphs), human-sounding, and ready to use.
Do not use placeholders like [Your Name]. Use "I" statements.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const letter = response.text;
    res.json({ letter });
  } catch (error) {
    console.error("POST /cover-letter error:", error);
    res.status(500).json({ message: "Failed to generate cover letter" });
  }
});

export default router;
