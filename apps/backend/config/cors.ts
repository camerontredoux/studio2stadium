import env from "#start/env";
import app from "@adonisjs/core/services/app";
import { defineConfig } from "@adonisjs/cors";

/** The product's own origins, allowed on every route. */
const PRODUCT_ORIGINS = [
  "https://api.studio2stadium.com",
  "https://app.studio2stadium.com",
];

/**
 * Two marketing surfaces call the API from a visitor's browser, each on its
 * own paths only. Nobody signs in on either, so neither has any business with
 * a route a product session could reach.
 *
 * - The marketing homepage reads `GET /stats/public`.
 * - The S2S Live site calls the Event Tier checkout endpoints
 *   (`POST /event-tiers/checkout` and `GET /event-tiers/checkout/:sessionId`).
 *   Its origin is the one in `MARKETING_SITE_URL` (where Checkout returns the
 *   buyer), plus any listed in the optional, comma-separated
 *   `MARKETING_SITE_ORIGINS`, for a site served from both the apex and `www`,
 *   or a preview deployment.
 */
const STATS_ORIGINS = [
  "https://studio2stadium.com",
  "https://www.studio2stadium.com",
];

const STATS_PATH = /^\/stats\/public(\?.*)?$/;

const CHECKOUT_ORIGINS = [
  new URL(env.get("MARKETING_SITE_URL")).origin,
  ...(env.get("MARKETING_SITE_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin),
];

const CHECKOUT_PATH = /^\/event-tiers\/checkout(\/[^/?]+)?(\?.*)?$/;

export function allowsOrigin(origin: string, path: string) {
  if (PRODUCT_ORIGINS.includes(origin)) return true;

  if (STATS_ORIGINS.includes(origin) && STATS_PATH.test(path)) return true;

  return CHECKOUT_ORIGINS.includes(origin) && CHECKOUT_PATH.test(path);
}

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: app.inProduction
    ? (origin, ctx) => allowsOrigin(origin, ctx.request.url())
    : true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  headers: app.inProduction
    ? [
        "Content-Type",
        "Authorization",
        "Accept",
        // TUS upload headers
        "Upload-Length",
        "Upload-Metadata",
        "Tus-Resumable",
        "Tus-Version",
        "Tus-Extension",
        "Tus-Max-Size",
        "Upload-Offset",
        "Upload-Creator",
        "Upload-Checksum",
        "Upload-Defer-Length",
        "X-HTTP-Method-Override",
        "X-Requested-With",
        "X-XSRF-TOKEN",
        // Sent by the frontend in admin "view-as" preview mode (see
        // app/middleware/routes/org-event.ts). Must be allow-listed or the
        // CORS preflight is rejected without an ACAO header.
        "X-Act-As-Type",
      ]
    : true,
  exposeHeaders: [
    "Retry-After",
    // TUS response headers
    "Location",
    "Tus-Resumable",
    "Tus-Version",
    "Tus-Extension",
    "Tus-Max-Size",
    "Upload-Offset",
    "Upload-Length",
    "stream-media-id",
  ],
  credentials: true,
  maxAge: 90,
});

export default corsConfig;
