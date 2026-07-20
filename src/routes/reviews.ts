import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import { reviewSchema } from "../validators/job.js";

const router = Router();

router.get("/:jobId", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const db = getDB();

    if (Array.isArray(jobId) || !ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid job id" });
    }

    const reviews = await db
      .collection("reviews")
      .find({ jobId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ reviews });
  } catch (error) {
    console.error("GET /reviews error:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

router.post("/:jobId", verifyToken, validate(reviewSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const db = getDB();
    const review = {
      jobId,
      userId: req.user?.id,
      userName: req.user?.name || "Anonymous",
      rating,
      comment: comment || "",
      createdAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(review);
    res.status(201).json({ message: "Review added", reviewId: result.insertedId });
  } catch (error) {
    console.error("POST /reviews error:", error);
    res.status(500).json({ message: "Failed to add review" });
  }
});

export default router;
