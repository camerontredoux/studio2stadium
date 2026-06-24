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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PostHogProvider client={posthog}>
        <RouterProvider router={router} />
      </PostHogProvider>
    </QueryClientProvider>
  </StrictMode>,
);
