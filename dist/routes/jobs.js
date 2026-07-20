import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import { addJobSchema, updateJobSchema } from "../validators/job.js";
const router = Router();
// GET /api/jobs — public, with search/filter/sort/pagination
router.get("/", async (req, res) => {
    try {
        const db = getDB();
        const { search, category, jobType, sort = "newest", page = "1", limit = "8", } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
            ];
        }
        if (category && category !== "all") {
            query.category = category;
        }
        if (jobType && jobType !== "all") {
            query.jobType = jobType;
        }
        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            salaryHigh: { salaryMax: -1 },
            salaryLow: { salaryMin: 1 },
        };
        const sortOption = sortMap[sort] || sortMap.newest;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [jobs, total] = await Promise.all([
            db.collection("jobs").find(query).sort(sortOption).skip(skip).limit(limitNum).toArray(),
            db.collection("jobs").countDocuments(query),
        ]);
        res.json({
            jobs,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
        });
    }
    catch (error) {
        console.error("GET /jobs error:", error);
        res.status(500).json({ message: "Failed to fetch jobs" });
    }
});
// GET /api/jobs/my/all — protected, শুধু নিজের saved jobs
router.get("/my/all", verifyToken, async (req, res) => {
    try {
        const db = getDB();
        const jobs = await db
            .collection("jobs")
            .find({ postedBy: req.user?.id })
            .sort({ updatedAt: -1 })
            .toArray();
        res.json({ jobs });
    }
    catch (error) {
        console.error("GET /jobs/my/all error:", error);
        res.status(500).json({ message: "Failed to fetch your jobs" });
    }
});
// GET /api/jobs/:id — public, single job details
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (Array.isArray(id) || !ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid job id" });
        }
        const db = getDB();
        const job = await db.collection("jobs").findOne({ _id: new ObjectId(id) });
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        res.json(job);
    }
    catch (error) {
        console.error("GET /jobs/:id error:", error);
        res.status(500).json({ message: "Failed to fetch job" });
    }
});
// POST /api/jobs — protected
router.post("/", verifyToken, validate(addJobSchema), async (req, res) => {
    try {
        const db = getDB();
        const newJob = {
            ...req.body,
            postedBy: req.user?.id,
            status: "saved",
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await db.collection("jobs").insertOne(newJob);
        res.status(201).json({ message: "Job saved", jobId: result.insertedId });
    }
    catch (error) {
        console.error("POST /jobs error:", error);
        res.status(500).json({ message: "Failed to save job" });
    }
});
// PATCH /api/jobs/:id — protected (status update, edit)
router.patch("/:id", verifyToken, validate(updateJobSchema), async (req, res) => {
    try {
        const { id } = req.params;
        if (Array.isArray(id) || !ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid job id" });
        }
        const db = getDB();
        const result = await db.collection("jobs").updateOne({ _id: new ObjectId(id), postedBy: req.user?.id }, { $set: { ...req.body, updatedAt: new Date() } });
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Job not found or not yours" });
        }
        res.json({ message: "Job updated" });
    }
    catch (error) {
        console.error("PATCH /jobs/:id error:", error);
        res.status(500).json({ message: "Failed to update job" });
    }
});
// DELETE /api/jobs/:id — protected
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        if (Array.isArray(id) || !ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid job id" });
        }
        const db = getDB();
        const result = await db.collection("jobs").deleteOne({
            _id: new ObjectId(id),
            postedBy: req.user?.id,
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Job not found or not yours" });
        }
        res.json({ message: "Job deleted" });
    }
    catch (error) {
        console.error("DELETE /jobs/:id error:", error);
        res.status(500).json({ message: "Failed to delete job" });
    }
});
export default router;
