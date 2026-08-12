import { describe, it, expect, vi } from "vitest";
import { validate } from "../middleware/validate.js";
import { z } from "zod";
import type { Response } from "express";

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { res, spy: res as unknown as Response };
}

const schema = z.object({
  title: z.string().min(1),
  rating: z.number().int().min(1).max(5),
});

describe("validate middleware", () => {
  it("passes valid body through to next", () => {
    const { res, spy } = mockRes();
    const req = { body: { title: "Engineer", rating: 4 } } as never;
    const next = vi.fn();

    validate(schema)(req, spy, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req).toEqual({ body: { title: "Engineer", rating: 4 } });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects invalid body with 400 and field errors", () => {
    const { res, spy } = mockRes();
    const req = { body: { title: "", rating: 9 } } as never;
    const next = vi.fn();

    validate(schema)(req, spy, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.message).toBe("Validation failed");
    expect(Array.isArray(jsonArg.errors)).toBe(true);
    expect(jsonArg.errors.length).toBeGreaterThan(0);
    expect(jsonArg.errors[0]).toHaveProperty("field");
  });
});