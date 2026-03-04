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
  methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
  headers: app.inProduction
    ? [
        "Content-Type",
        "Authorization",
        "Accept",
        // TUS upload headers
        "Upload-Length",
        "Upload-Metadata",
        "Tus-Resumable",
        "Upload-Offset",
        "Upload-Creator",
      ]
    : true,
  exposeHeaders: [
    "Retry-After",
    // TUS response headers
    "Location",
    "Tus-Resumable",
    "stream-media-id",
  ],
  credentials: true,
  maxAge: 90,
});

export default corsConfig;
