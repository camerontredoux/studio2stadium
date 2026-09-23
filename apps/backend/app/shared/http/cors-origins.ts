/**
 * Parse a comma-separated list of origins, such as CORS_ORIGINS. Each entry is
 * normalized to its bare origin (scheme, host and port), so a trailing slash
 * or path does not stop an exact match. An entry that is not a URL throws, so
 * a typo fails at boot instead of silently blocking a frontend.
 */
export function parseOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin);
}
