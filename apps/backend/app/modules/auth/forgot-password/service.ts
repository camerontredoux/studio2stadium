import { DatabaseService } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import { inject } from "@adonisjs/core";
import { mintPasswordToken } from "../password-tokens.ts";
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

    const token = await mintPasswordToken("reset", user.id);

    return { token, userId: user.id };
  }
}
