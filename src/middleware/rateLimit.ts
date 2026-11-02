import { rateLimit } from "express-rate-limit";
import type { Request } from "express";

/**
 * Resolve the real client IP when running behind a proxy (Vercel sets both
 * `X-Forwarded-For` and the standardized `Forwarded` header).
 */
function clientIp(req: Request): string {
  const forwarded = req.headers["forwarded"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const match = /for=("?)([^";,]+)\1/i.exec(forwarded);
    if (match?.[2]) return match[2];
  }

  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string" && xForwardedFor.length > 0) {
    return xForwardedFor.split(",")[0].trim();
  }

  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

// We handle proxy headers ourselves above, so silence the default proxy
// validations that assume the default keyGenerator.
const proxyValidation = {
  forwardedHeader: false,
  xForwardedForHeader: false,
} as const;

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: clientIp,
  validate: proxyValidation,
  message: { message: "Too many requests — please slow down and try again in a minute." },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: clientIp,
  validate: proxyValidation,
  message: { message: "Too many requests — please slow down." },
});
