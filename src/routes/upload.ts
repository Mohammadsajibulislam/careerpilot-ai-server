import { Router, Response } from "express";
import path from "node:path";
import { createRequire } from "node:module";
import multer, { FileFilterCallback } from "multer";
import mammoth from "mammoth";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";
import { getDB } from "../config/db.js";
import { extractSkills } from "../lib/skills.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Note: do NOT set `GlobalWorkerOptions.workerSrc` here. In Node, pdfjs-dist
// disables the real worker and sets a default workerSrc used for its in-process
// fake worker. Overwriting it (even with "") breaks PDF parsing at runtime.

// pdfjs needs its bundled font/CMap data to read non-embedded standard fonts
// (e.g. Helvetica). Resolve them from the installed package so extraction does
// not emit "standardFontDataUrl is required" warnings.
const pdfjsRequire = createRequire(import.meta.url);
const PDFJS_ROOT = path.resolve(
  path.dirname(pdfjsRequire.resolve("pdfjs-dist/legacy/build/pdf.mjs")),
  "..",
  ".."
);
const STANDARD_FONT_DATA_URL = path.join(PDFJS_ROOT, "standard_fonts") + path.sep;
const CMAP_URL = path.join(PDFJS_ROOT, "cmaps") + path.sep;

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
    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(file.buffer),
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
      cMapUrl: CMAP_URL,
      cMapPacked: true,
    }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return text.trim();
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
      const detectedSkills = extractSkills(text);

      const profile = await db.collection("profiles").findOneAndUpdate(
        { userId: req.user?.id },
        {
          $set: {
            resumeText: text,
            resumeFileName: req.file.originalname,
            updatedAt: new Date(),
          },
          // Merge detected skills without duplicating the user's existing ones.
          $addToSet: { skills: { $each: detectedSkills } },
        },
        { upsert: true, returnDocument: "after" }
      );

      res.json({
        message: "Resume uploaded",
        fileName: req.file.originalname,
        textLength: text.length,
        resumeText: text,
        skills: Array.isArray(profile?.skills) ? profile.skills : detectedSkills,
      });
    } catch (error) {
      console.error("POST /upload/resume error:", error);
      res.status(500).json({ message: "Failed to upload resume" });
    }
  }
);

export default router;
