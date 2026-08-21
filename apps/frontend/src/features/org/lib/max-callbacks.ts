export const DEFAULT_MAX_CALLBACKS_PER_COACH = 5;
export const UNLIMITED_CALLBACKS = -1;

/**
 * Mirrors the backend's `resolveMaxCallbacks` so the publish dialog never
 * describes a cap the server will not apply. Anything below 1 is unlimited.
 */
export function resolveMaxCallbacks(settings: Record<string, unknown>): number {
  const raw = settings.max_callbacks_per_coach;

  if (raw === undefined || raw === null || raw === "") {
    return DEFAULT_MAX_CALLBACKS_PER_COACH;
  }

  const parsed = typeof raw === "number" ? raw : Number(raw);

  if (!Number.isFinite(parsed)) return DEFAULT_MAX_CALLBACKS_PER_COACH;
  if (parsed < 1) return UNLIMITED_CALLBACKS;

  return Math.floor(parsed);
}
