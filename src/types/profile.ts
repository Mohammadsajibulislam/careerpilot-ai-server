export interface UserProfile {
  userId: string;
  resumeText: string; // plain text — paste করা resume/skills summary
  skills: string[];
  updatedAt: Date;
}