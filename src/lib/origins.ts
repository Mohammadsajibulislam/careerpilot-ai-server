/**
 * Matches an origin against an allowlist entry.
 * Entries may be exact origins (`https://example.com`) or use `*` as a wildcard
 * (`https://careerpilot-ai-client-*.vercel.app`).
 */
function matchesOrigin(origin: string, pattern: string): boolean {
  if (!pattern.includes("*")) return origin === pattern;

  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  return new RegExp(`^${escaped}$`).test(origin);
}

export function isOriginAllowed(origin: string | undefined, allowed: readonly string[]): boolean {
  if (!origin) return false;
  if (!Array.isArray(allowed) || allowed.length === 0) return false;
  return allowed.some((pattern) => matchesOrigin(origin, pattern));
}
