/**
 * Tracks which recommended program to feature in the "Program Spotlight".
 *
 * The rotation advances once per login (see `advanceSpotlightRotation`, called
 * from the login mutation) and is read by the feed to pick the spotlight index
 * as `rotation % recommendedCount`. A plain page refresh keeps the same
 * spotlight; only a fresh login rotates it.
 */
const KEY = "s2s:spotlight-rotation";

export function getSpotlightRotation(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(KEY);
  if (raw === null) return 0;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Advance the rotation for the next login. The first login seeds it to 0 (so
 * the first spotlight is program 0); each subsequent login increments it.
 */
export function advanceSpotlightRotation(): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(KEY);
  if (raw === null) {
    window.localStorage.setItem(KEY, "0");
    return;
  }
  window.localStorage.setItem(KEY, String(getSpotlightRotation() + 1));
}
