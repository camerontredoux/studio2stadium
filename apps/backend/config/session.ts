import env from "#start/env";
import app from "@adonisjs/core/services/app";
import { defineConfig, stores } from "@adonisjs/session";

const sessionConfig = defineConfig({
  enabled: true,
  cookieName: "auth_session",

  /**
   * When set to true, the session id cookie will be deleted
   * once the user closes the browser.
   */
  clearWithBrowser: false,

  /**
   * Define how long to keep the session data alive without
   * any activity. SESSION_AGE is in seconds, session config expects ms.
   */
  age: env.get("SESSION_AGE"),

  /**
   * Configuration for session cookie and the
   * cookie store
   */
  cookie: {
    path: "/",
    httpOnly: true,
    secure: app.inProduction,
    sameSite: "lax",
  },

  /**
   * https://docs.adonisjs.com/guides/basics/session#stores-configuration
   * "main" connection comes from redis.ts config file
   */
  store: env.get("SESSION_DRIVER"),
  stores: {
    redis: stores.redis({ connection: "session" }),
  },
});

export default sessionConfig;
