/**
 * Tracks which recommended item to feature in the "Spotlight".
 *
 * The rotation advances once per page load — a tab refresh reruns this module,
 * so each refresh features the next item — and is read by the feed to pick the
 * spotlight index as `rotation % recommendedCount`. The value is memoized for
 * the lifetime of the load so the spotlight and its companion "Suggested" list
 * stay in sync, and it is persisted so each refresh continues the cycle instead
 * of restarting.
 */
const KEY = "s2s:spotlight-rotation";

// The rotation chosen for the current page load. Read and advanced once, then
// reused for every call during this load.
let currentRotation: number | null = null;

function readStored(): number {
  const raw = window.localStorage.getItem(KEY);
  if (raw === null) return 0;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function getSpotlightRotation(): number {
  if (currentRotation !== null) return currentRotation;
  if (typeof window === "undefined") return 0;

  // Use the stored rotation for this load, then advance it so the next tab
  // refresh features the following item.
  currentRotation = readStored();
  window.localStorage.setItem(KEY, String(currentRotation + 1));
  return currentRotation;
}
