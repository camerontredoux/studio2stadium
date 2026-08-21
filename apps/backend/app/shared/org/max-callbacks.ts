export const DEFAULT_MAX_CALLBACKS_PER_COACH = 5;
export const UNLIMITED_CALLBACKS = -1;

/**
 * Resolve `max_callbacks_per_coach` from an org's settings JSONB.
 *
 * The admin UI documents "-1 for unlimited", but the value has been written by
 * more than one code path over time and can arrive as a number or a string.
 * Anything below 1 means unlimited — releasing every callback is recoverable,
 * while silently publishing none is the failure this setting caused before.
 */
export function resolveMaxCallbacks(settings: unknown): number {
  const raw = (settings as { max_callbacks_per_coach?: unknown } | null)
    ?.max_callbacks_per_coach;

  if (raw === undefined || raw === null || raw === "") {
    return DEFAULT_MAX_CALLBACKS_PER_COACH;
  }

  const parsed = typeof raw === "number" ? raw : Number(raw);

  if (!Number.isFinite(parsed)) return DEFAULT_MAX_CALLBACKS_PER_COACH;
  if (parsed < 1) return UNLIMITED_CALLBACKS;

  return Math.floor(parsed);
}
