import env from "#start/env";
import { Secret } from "@adonisjs/core/helpers";
import { defineConfig } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";

/**
 * The app key is used for encrypting cookies, generating signed URLs,
 * and by the "encryption" module.
 *
 * The encryption module will fail to decrypt data if the key is lost or
 * changed. Therefore it is recommended to keep the app key secure.
 */
export const appKey = new Secret(env.get("APP_KEY"));

/**
 * Domain of every cookie the app sets in production (auth cookies included,
 * see config/auth.ts). Shared by the api. and app. subdomains. COOKIE_DOMAIN
 * overrides it. In development cookies stay host-only.
 */
export const cookieDomain = app.inProduction
  ? (env.get("COOKIE_DOMAIN") ?? ".studio2stadium.com")
  : undefined;

/**
 * The configuration settings used by the HTTP server
 */
export const http = defineConfig({
  generateRequestId: app.inProduction,
  allowMethodSpoofing: false,

  /**
   * Enabling async local storage will let you access HTTP context
   * from anywhere inside your application.
   */
  useAsyncLocalStorage: true,

  /**
   * Manage cookies configuration. The settings for the session id cookie are
   * defined inside the "config/session.ts" file.
   */
  cookie: {
    domain: cookieDomain,
    maxAge: "2h",
    httpOnly: true,
    secure: app.inProduction,
    sameSite: "lax",
  },
});
