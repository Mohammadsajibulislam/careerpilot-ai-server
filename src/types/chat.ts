import { ObjectId } from "mongodb";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export interface ChatSession {
  _id?: ObjectId;
  userId: string;
  jobId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
