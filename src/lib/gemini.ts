import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("❌ GEMINI_API_KEY .env ফাইলে পাওয়া যায়নি");
}

export const ai = new GoogleGenAI({ apiKey });

export const GEMINI_MODEL = "gemini-2.5-flash";