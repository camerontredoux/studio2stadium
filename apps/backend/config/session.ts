import app from "@adonisjs/core/services/app";
import { defineConfig, stores } from "@adonisjs/session";

const sessionConfig = defineConfig({
  enabled: true,
  cookieName: "adonis-session",

  /**
   * When set to true, the session id cookie will be deleted
   * once the user closes the browser.
   */
  clearWithBrowser: false,

  /**
   * Define how long to keep the session data alive without
   * any activity.
   */
  age: "2h",

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
  store: "redis",
  stores: {
    redis: stores.redis({ connection: "session" }),
  },
});

export default sessionConfig;
