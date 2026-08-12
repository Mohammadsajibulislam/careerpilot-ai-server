import { describe, it, expect } from "vitest";
import { extractJsonObject } from "../lib/parseAiJson.js";

describe("extractJsonObject", () => {
  it("parses a plain JSON object", () => {
    expect(extractJsonObject('{"score": 80}')).toEqual({ score: 80 });
  });

  it("strips surrounding markdown code fences", () => {
    const input = '```json\n{"score": 90, "reasons": ["a"]}\n```';
    expect(extractJsonObject(input)).toEqual({ score: 90, reasons: ["a"] });
  });

  it("extracts JSON embedded in prose", () => {
    const input = 'Here is your match:\n{"score": 65, "reasons": ["good"], "gaps": ["x"]}\nDone.';
    expect(extractJsonObject(input)).toEqual({ score: 65, reasons: ["good"], gaps: ["x"] });
  });

  it("returns null for invalid JSON", () => {
    expect(extractJsonObject("Sorry, I cannot produce JSON")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractJsonObject("")).toBeNull();
  });

  it("returns null when parsed value is not an object", () => {
    expect(extractJsonObject('["array"]')).toBeNull();
    expect(extractJsonObject('"just a string"')).toBeNull();
  });
});