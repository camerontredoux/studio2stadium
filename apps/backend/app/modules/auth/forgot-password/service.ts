import { DatabaseService } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import { inject } from "@adonisjs/core";
import redis from "@adonisjs/redis/services/main";
import { hash, randomBytes } from "node:crypto";
import { ForgotPasswordSchema } from "./schema.ts";

@inject()
export class ForgotPasswordService {
  constructor(private db: DatabaseService) {}

  async execute(payload: ForgotPasswordSchema) {
    const { email } = payload;

    const normalizedEmail = await normalizeEmail(email);

    const user = await this.db.use((db) =>
      db.query.users.findFirst({
        where: { email: normalizedEmail },
      })
    );

    if (!user) {
      return { token: null, userId: null };
    }

    const token = randomBytes(32).toString("hex");
    const hashedToken = hash("sha256", token);

    await redis.setex(`forgot-password:${user.id}`, 900, hashedToken);

    return { token, userId: user.id };
  }
}
