import { ObjectId } from "mongodb";

export interface Job {
  _id?: ObjectId;
  title: string;
  company: string;
  location: string;
  jobType: "Remote" | "Hybrid" | "On-site";
  category: string; // e.g. "Frontend", "Backend", "Full Stack", "DevOps"
  salaryMin: number;
  salaryMax: number;
  description: string;
  shortDescription: string;
  requirements: string[];
  imageUrl: string;
  applyUrl: string;
  postedBy: string; // user id who saved/added it
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}