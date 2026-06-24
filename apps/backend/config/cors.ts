import app from "@adonisjs/core/services/app";
import { defineConfig } from "@adonisjs/cors";

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: app.inProduction
    ? ["https://api.studio2stadium.com", "https://app.studio2stadium.com"]
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
