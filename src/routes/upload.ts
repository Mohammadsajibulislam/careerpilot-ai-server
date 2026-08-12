import { Router, Response } from "express";
import multer, { FileFilterCallback } from "multer";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";
import { getDB } from "../config/db.js";

interface FileRequest extends AuthRequest {
  file?: Express.Multer.File;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error("Only PDF, DOCX, and TXT files are allowed") as Error & {
        statusCode: number;
      };
      err.statusCode = 400;
      cb(err);
    }
  },
});

async function extractText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy().catch(() => undefined);
    }
  }

  if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  return file.buffer.toString("utf-8");
}

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

      const text = await extractText(req.file);

      if (!text.trim()) {
        return res.status(422).json({ message: "Couldn't read any text from this file" });
      }

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
