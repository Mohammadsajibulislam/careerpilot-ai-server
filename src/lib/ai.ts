import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY not found in .env");
}

export const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey,
  defaultHeaders: {
    "HTTP-Referer": "https://careerpilot-ai-client.vercel.app",
    "X-Title": "CareerPilot AI",
  },
});

export const AI_MODEL = "meta-llama/llama-3.3-70b-instruct";
