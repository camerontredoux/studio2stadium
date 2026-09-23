import { parseOrigins } from "#shared/http/cors-origins";
import env from "#start/env";
import app from "@adonisjs/core/services/app";
import { defineConfig } from "@adonisjs/cors";

/**
 * The product's own origins, allowed on every route. The optional,
 * comma-separated `CORS_ORIGINS` adds exact origins to this list (staging
 * sets its own hostnames there). Unset leaves only the prod hostnames.
 */
const PRODUCT_ORIGINS = [
  "https://api.studio2stadium.com",
  "https://app.studio2stadium.com",
  ...parseOrigins(env.get("CORS_ORIGINS")),
];

/**
 * The S2S Live marketing site calls the Event Tier checkout endpoints from the
 * buyer's browser (`POST /event-tiers/checkout` and
 * `GET /event-tiers/checkout/:sessionId`) and nothing else, so its origin is
 * allowed on those paths only. Nobody signs in there, so it has no business
 * with any route a product session could reach.
 *
 * Its origin is the one in `MARKETING_SITE_URL` (where Checkout returns the
 * buyer), plus any listed in the optional, comma-separated
 * `MARKETING_SITE_ORIGINS` — for a site served from both the apex and `www`,
 * or a preview deployment.
 */
const MARKETING_ORIGINS = [
  new URL(env.get("MARKETING_SITE_URL")).origin,
  ...(env.get("MARKETING_SITE_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin),
];

const MARKETING_PATH = /^\/event-tiers\/checkout(\/[^/?]+)?(\?.*)?$/;

export function allowsOrigin(origin: string, path: string) {
  if (PRODUCT_ORIGINS.includes(origin)) return true;

  return MARKETING_ORIGINS.includes(origin) && MARKETING_PATH.test(path);
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
