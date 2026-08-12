export function isOriginAllowed(origin: string | undefined, allowed: readonly string[]): boolean {
  if (!origin) return false;
  if (!Array.isArray(allowed) || allowed.length === 0) return false;
  return allowed.includes(origin);
}
