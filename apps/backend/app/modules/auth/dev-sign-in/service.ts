import type { SessionUser } from "#auth/provider";
import { getUserSession } from "#auth/queries";
import { inject } from "@adonisjs/core";
import redis from "@adonisjs/redis/services/main";
import { createHash } from "node:crypto";
import type { Validator } from "./validator.ts";

/**
 * The Redis key (on the `cache` connection, which has no key prefix) that
 * holds the user ID a dev sign-in code was minted for. The key holds the
 * code's SHA-256, never the code. The run-dev-server skill's sign-in.sh writes
 * it with `SET <key> <userId> EX 300 NX`.
 */
export function devSignInKey(code: string): string {
  return `dev-sign-in:${createHash("sha256").update(code).digest("hex")}`;
}

@inject()
export class Service {
  /**
   * Consumes the code (GETDEL, so it works once even under concurrent
   * requests) and returns the session user it was minted for, or null when
   * the code is unknown, used or expired.
   */
  async execute({ code }: Validator): Promise<SessionUser | null> {
    const userId = await redis.connection("cache").getdel(devSignInKey(code));
    if (!userId) return null;

    return await getUserSession(userId);
  }
}
