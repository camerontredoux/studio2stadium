import { useSyncExternalStore } from "react";

// Which called-back dancers an admin has already sent on, per event and showcase. Kept in
// localStorage only, so a reload or reopening the widget keeps the marks on this browser.
export function sentCallbacksKey(eventId: string, showcaseId: string) {
  return `s2s.sentCallbacks.${eventId}.${showcaseId}`;
}

export function readSent(key: string): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function setSent(key: string, rosterId: string, sent: boolean) {
  const ids = new Set(readSent(key));
  if (sent) ids.add(rosterId);
  else ids.delete(rosterId);
  try {
    if (ids.size > 0) localStorage.setItem(key, JSON.stringify([...ids]));
    else localStorage.removeItem(key);
  } catch {
    // Storage full or blocked: the mark just won't survive a reload.
  }
  for (const listener of listeners) listener();
}

// Each key's parsed set is cached against its stored string, so the snapshot stays the
// same object between writes, as useSyncExternalStore requires.
const cache = new Map<
  string,
  { raw: string | null; ids: ReadonlySet<string> }
>();

function snapshot(key: string): ReadonlySet<string> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    // Blocked storage reads as no marks.
  }
  let entry = cache.get(key);
  if (!entry || entry.raw !== raw) {
    entry = { raw, ids: new Set(readSent(key)) };
    cache.set(key, entry);
  }
  return entry.ids;
}

export function useSentCallbacks(key: string) {
  return useSyncExternalStore(subscribe, () => snapshot(key));
}
