import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import hash from "@adonisjs/core/services/hash";
import redis from "@adonisjs/redis/services/main";
import { eq } from "drizzle-orm";
import { hash as hashSha256 } from "node:crypto";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(payload: Validator) {
    const user = await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          id: payload.userId,
        },
        columns: {
          password: true,
        },
      })
    );

    if (!user) throw new E_BAD_REQUEST("User not found");

    const hashedToken = await redis.get(`forgot-password:${payload.userId}`);
    if (!hashedToken) {
      throw new E_BAD_REQUEST(
        "Could not find reset token. Please request a new one."
      );
    }

    const verified = hashSha256("sha256", payload.token) === hashedToken;
    if (!verified) {
      throw new E_BAD_REQUEST("Invalid reset token");
    }

    const password = await hash.make(payload.password);

    await this.db.use((db) =>
      db.update(users).set({ password }).where(eq(users.id, payload.userId))
    );

    await redis.del(`forgot-password:${payload.userId}`);
  }
}
