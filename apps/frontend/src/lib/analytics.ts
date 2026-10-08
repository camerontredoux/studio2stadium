import posthog from "posthog-js";

type Properties = Record<string, unknown>;

/**
 * Sends a product analytics event. Never throws: analytics must not break the
 * action that triggered it. PostHog only runs in production builds, so dev
 * builds log the event instead.
 */
export function track(event: string, properties: Properties = {}) {
  try {
    if (posthog.__loaded) {
      posthog.capture(event, properties);
    } else if (import.meta.env.DEV) {
      console.debug("[analytics]", event, properties);
    }
  } catch {
    // Ignore analytics failures.
  }
}

/**
 * Sends an event at most once per browser session for the given key.
 */
export function trackOncePerSession(
  key: string,
  event: string,
  properties: Properties = {},
) {
  try {
    const storageKey = `analytics:${key}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
  } catch {
    // Storage can be unavailable (private mode); send the event anyway.
  }
  track(event, properties);
}
