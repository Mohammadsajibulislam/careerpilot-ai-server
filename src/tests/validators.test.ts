import { describe, it, expect } from "vitest";
import { addJobSchema, reviewSchema, coverLetterSchema } from "../validators/job.js";

describe("addJobSchema", () => {
  it("passes valid job input", () => {
    const result = addJobSchema.parse({
      title: "Software Engineer",
      company: "Acme Inc",
      location: "Remote",
      jobType: "Remote",
      category: "Engineering",
      salaryMin: 80000,
      salaryMax: 120000,
      shortDescription: "A great role",
      description: "Full description here",
      requirements: ["React", "TypeScript"],
    });
    expect(result.title).toBe("Software Engineer");
  });

  it("rejects missing title", () => {
    expect(() =>
      addJobSchema.parse({
        company: "Acme Inc",
        location: "Remote",
        jobType: "Remote",
        category: "Engineering",
        shortDescription: "A great role",
        description: "Full description here",
      })
    ).toThrow();
  });

  it("rejects invalid jobType", () => {
    expect(() =>
      addJobSchema.parse({
        title: "Engineer",
        company: "Acme Inc",
        location: "Remote",
        jobType: "Invalid",
        category: "Engineering",
        shortDescription: "A great role",
        description: "Full description here",
      })
    ).toThrow();
  });
});

describe("reviewSchema", () => {
  it("passes valid review", () => {
    const result = reviewSchema.parse({ rating: 4, comment: "Great job" });
    expect(result.rating).toBe(4);
  });

  it("rejects rating > 5", () => {
    expect(() => reviewSchema.parse({ rating: 6 })).toThrow();
  });

  it("rejects rating < 1", () => {
    expect(() => reviewSchema.parse({ rating: 0 })).toThrow();
  });
});

describe("coverLetterSchema", () => {
  it("passes with minimum fields", () => {
    const result = coverLetterSchema.parse({ company: "Google", role: "Engineer" });
    expect(result.tone).toBe("professional");
  });

  it("rejects missing company", () => {
    expect(() => coverLetterSchema.parse({ role: "Engineer" })).toThrow();
  });
});
