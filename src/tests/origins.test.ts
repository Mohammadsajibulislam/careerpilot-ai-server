import { describe, it, expect } from "vitest";
import { isOriginAllowed } from "../lib/origins.js";

const allowed = [
  "http://localhost:3000",
  "https://careerpilot-ai-client.vercel.app",
];

describe("isOriginAllowed", () => {
  it("allows an exact match", () => {
    expect(isOriginAllowed("https://careerpilot-ai-client.vercel.app", allowed)).toBe(true);
  });

  it("rejects a lookalike origin (prefix attack)", () => {
    expect(isOriginAllowed("https://careerpilot-ai-client.vercel.app.evil.com", allowed)).toBe(false);
    expect(isOriginAllowed("https://careerpilot-ai-client.vercel.app.com", allowed)).toBe(false);
  });

  it("rejects subdomain variants", () => {
    expect(isOriginAllowed("https://sub.careerpilot-ai-client.vercel.app", allowed)).toBe(false);
  });

  it("rejects different ports", () => {
    expect(isOriginAllowed("http://localhost:3001", allowed)).toBe(false);
  });

  it("rejects undefined and empty origins", () => {
    expect(isOriginAllowed(undefined, allowed)).toBe(false);
    expect(isOriginAllowed("", allowed)).toBe(false);
  });
});
