import { z } from "zod";

export const addJobSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  company: z.string().min(1, "Company is required").max(200),
  location: z.string().min(1, "Location is required").max(100),
  jobType: z.enum(["Remote", "Hybrid", "On-site"]),
  category: z.string().min(1, "Category is required"),
  salaryMin: z.number().min(0).default(0),
  salaryMax: z.number().min(0).default(0),
  shortDescription: z.string().min(1).max(500),
  description: z.string().min(1),
  requirements: z.array(z.string()).default([]),
  imageUrl: z.string().url().or(z.literal("")).default(""),
  applyUrl: z.string().url().or(z.literal("")).default(""),
});

export const updateJobSchema = z.object({
  title: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  location: z.string().max(100).optional(),
  jobType: z.enum(["Remote", "Hybrid", "On-site"]).optional(),
  category: z.string().optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  imageUrl: z.string().url().or(z.literal("")).optional(),
  applyUrl: z.string().url().or(z.literal("")).optional(),
  status: z.enum(["saved", "applied", "interview", "offer", "rejected"]).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).default(""),
});

export const coverLetterSchema = z.object({
  company: z.string().min(1, "Company is required").max(200),
  role: z.string().min(1, "Role is required").max(200),
  skills: z.string().max(500).optional(),
  tone: z.enum(["professional", "enthusiastic", "concise"]).default("professional"),
});

export const profileSchema = z.object({
  resumeText: z.string().max(50000).default(""),
  skills: z.array(z.string()).default([]),
});
