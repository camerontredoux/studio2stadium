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
    : [
        "http://localhost:3333",
        "http://localhost:5173",
        "http://localhost:4173",
      ],
  methods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
  headers: app.inProduction
    ? ["Content-Type", "Authorization", "Accept"]
    : true,
  exposeHeaders: ["Retry-After"],
  credentials: true,
  maxAge: 90,
});

export default corsConfig;
