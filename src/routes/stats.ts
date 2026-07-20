import { Router, Response } from "express";
import { getDB } from "../config/db.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";

const router = Router();

router.get("/",  async (req: AuthRequest, res: Response) => {
  try {
    const db = getDB();
    const userId = req.user?.id;

    const jobs = await db.collection("jobs").find({ postedBy: userId }).toArray();

    const statusCounts = {
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    const categoryCounts: Record<string, number> = {};

    jobs.forEach((job) => {
      if (job.status in statusCounts) {
        statusCounts[job.status as keyof typeof statusCounts]++;
      }
      categoryCounts[job.category] = (categoryCounts[job.category] || 0) + 1;
    });

    const now = new Date();
    const monthlyTrend: { month: string; count: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = targetDate.toLocaleDateString("en-US", { month: "short" });

      const count = jobs.filter((job) => {
        const created = new Date(job.createdAt);
        return created >= targetDate && created < nextMonth;
      }).length;

      monthlyTrend.push({ month: label, count });
    }

    const totalJobs = jobs.length;
    const respondedCount = statusCounts.interview + statusCounts.offer + statusCounts.rejected;
    const responseRate = totalJobs > 0 ? Math.round((respondedCount / totalJobs) * 100) : 0;

    const matchCount = await db.collection("matches").countDocuments({ userId });
    const chatCount = await db.collection("chatSessions").countDocuments({ userId });

    res.json({
      totalJobs,
      statusCounts,
      categoryCounts,
      monthlyTrend,
      responseRate,
      matchCount,
      chatCount,
    });
  } catch (error) {
    console.error("GET /stats error:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

export default router;
