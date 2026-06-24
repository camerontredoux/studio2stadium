/*
|--------------------------------------------------------------------------
| Sentry instrumentation
|--------------------------------------------------------------------------
|
| Initialises Sentry error & performance monitoring. This file MUST be the
| first import in the process entrypoint (see bin/server.ts) so the SDK can
| patch Node internals (http, etc.) before they are loaded.
|
| The DSN is read from the SENTRY_DSN env var; when it is unset (e.g. local
| dev) Sentry stays disabled and this is a no-op.
|
*/

import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    dataCollection: {
      // To disable sending user data and HTTP bodies, uncomment the lines below:
      // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
      // userInfo: false,
      // httpBodies: [],
    },
  });
}
