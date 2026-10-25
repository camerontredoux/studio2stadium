import env from "#start/env";
import app from "@adonisjs/core/services/app";
import { defineConfig } from "@adonisjs/transmit";
import { redis } from "@adonisjs/transmit/transports/redis";

export default defineConfig({
  pingInterval: false,
  /**
   * Broadcasts fan out over Redis pub/sub, so a client on any Fly machine gets
   * them. Without a transport, a broadcast only reaches the machine that sent it.
   * The import is the `/redis` subpath: the `/transports` barrel also loads the
   * MQTT transport, whose `mqtt` peer is not installed.
   */
  transport: {
    driver: redis({
      host: env.get("REDIS_HOST"),
      port: env.get("REDIS_PORT"),
      username: env.get("REDIS_USERNAME"),
      password: env.get("REDIS_PASSWORD"),
      tls: app.inProduction ? {} : undefined,
    }),
  },
});
