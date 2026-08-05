import "nprogress/nprogress.css";
import "./index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import * as Sentry from "@sentry/react";

import { queryClient } from "./lib/query-client";

import { routeTree } from "@/routeTree.gen";
import { createRouter } from "@tanstack/react-router";
import ReactGA from "react-ga4";

import qs from "qs";

// Error monitoring. Disabled unless VITE_SENTRY_DSN is set at build time.
// Uses a separate (browser/React) Sentry project from the backend.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}

ReactGA.initialize(import.meta.env.VITE_GOOGLE_ANALYTICS_ID)

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
  },
  stringifySearch: (search) =>
    qs.stringify(search, {
      arrayFormat: "comma",
      addQueryPrefix: true,
      encode: false,
    }),
  parseSearch: (searchStr) => qs.parse(searchStr, { ignoreQueryPrefix: true }),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// A redeploy replaces every content-hashed file in /assets. Tabs that are
// already open still reference the previous filenames, and Cloudflare answers
// those with the SPA fallback -- index.html, 200, text/html -- instead of a 404,
// so the browser refuses the module on MIME grounds and the dynamic import
// fails. Reloading fetches the new index.html (served must-revalidate) and with
// it the new chunk names.
//
// Only call preventDefault() when we are actually reloading. Vite's preload
// helper rethrows unless the event is cancelled, so cancelling without
// reloading makes the failed import resolve to `undefined` instead -- which is
// what the router then reads `.errorComponent` off of, crashing the app with
// "Cannot read properties of undefined" rather than showing a real error.
const CHUNK_RELOAD_KEY = "chunk-reload-at";
const CHUNK_RELOAD_COOLDOWN_MS = 10_000;

let reloadingForStaleChunk = false;

window.addEventListener("vite:preloadError", (event) => {
  // A single navigation usually fails several chunks at once. The first one
  // schedules the reload; the rest just stay quiet until it commits.
  if (reloadingForStaleChunk) {
    event.preventDefault();
    return;
  }

  const now = Date.now();
  const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY)) || 0;

  // We just reloaded and the chunk still will not load, so it is genuinely
  // missing rather than stale. Let the error through instead of looping.
  if (now - lastReload < CHUNK_RELOAD_COOLDOWN_MS) return;

  reloadingForStaleChunk = true;
  event.preventDefault();
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthog}>
        <RouterProvider router={router} />
      </PostHogProvider>
    </QueryClientProvider>
  </StrictMode>,
);
