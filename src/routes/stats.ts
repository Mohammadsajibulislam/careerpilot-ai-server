import { Router, Response } from "express";
import { getDB } from "../config/db.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";

const router = Router();

const STATUSES = ["saved", "applied", "interview", "offer", "rejected"] as const;

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const db = getDB();
    const userId = req.user?.id;

    const now = new Date();
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const [statusCountsArr, categoryCountsArr, monthlyTrendArr, matchCount, chatCount] =
      await Promise.all([
        db
          .collection("jobs")
          .aggregate([
            { $match: { postedBy: userId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ])
          .toArray(),
        db
          .collection("jobs")
          .aggregate([
            { $match: { postedBy: userId } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
          ])
          .toArray(),
        db
          .collection("jobs")
          .aggregate([
            { $match: { postedBy: userId, createdAt: { $gte: sixMonthsAgo } } },
            {
              $project: {
                month: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } },
              },
            },
            { $group: { _id: "$month", count: { $sum: 1 } } },
          ])
          .toArray(),
        db.collection("matches").countDocuments({ userId }),
        db.collection("chatSessions").countDocuments({ userId }),
      ]);

    const statusCounts = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
    statusCountsArr.forEach(({ _id, count }) => {
      if ((STATUSES as readonly string[]).includes(_id)) {
        statusCounts[_id as keyof typeof statusCounts] = count;
      }
    });

    const categoryCounts: Record<string, number> = {};
    categoryCountsArr.forEach(({ _id, count }) => {
      categoryCounts[String(_id)] = count;
    });

    const monthlyMap = new Map<string, number>();
    monthlyTrendArr.forEach(({ _id, count }) => monthlyMap.set(_id, count));

    const monthlyTrend: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = target.toISOString().slice(0, 7);
      const label = target.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
      monthlyTrend.push({ month: label, count: monthlyMap.get(key) || 0 });
    }

    const totalJobs = statusCountsArr.reduce((sum, { count }) => sum + count, 0);
    const respondedCount =
      statusCounts.interview + statusCounts.offer + statusCounts.rejected;
    const responseRate = totalJobs > 0 ? Math.round((respondedCount / totalJobs) * 100) : 0;

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
