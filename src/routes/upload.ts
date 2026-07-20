import { Router, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";
import { getDB } from "../config/db.js";

interface FileRequest extends AuthRequest {
  file?: Express.Multer.File;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, and TXT files are allowed"));
    }
  },
});

const router = Router();

router.post(
  "/resume",
  verifyToken,
  upload.single("file"),
  async (req: FileRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const text = req.file.buffer.toString("utf-8");
      const db = getDB();

      await db.collection("profiles").updateOne(
        { userId: req.user?.id },
        {
          $set: {
            resumeText: text,
            resumeFileName: req.file.originalname,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      res.json({
        message: "Resume uploaded",
        fileName: req.file.originalname,
        textLength: text.length,
      });
    } catch (error) {
      console.error("POST /upload/resume error:", error);
      res.status(500).json({ message: "Failed to upload resume" });
    }
  }
);

export default router;
