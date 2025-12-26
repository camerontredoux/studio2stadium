import { AuthQueries } from "#auth/queries";
import type { SessionUser } from "#auth/redis/provider";
import { errors as auth } from "@adonisjs/auth";
import { inject } from "@adonisjs/core";
import { RuntimeException } from "@adonisjs/core/exceptions";
import hash from "@adonisjs/core/services/hash";
import type { LoginValidator } from "./validator.ts";

@inject()
export class LoginService {
  constructor(private queries: AuthQueries) {}

  async execute({ email, password }: LoginValidator): Promise<SessionUser> {
    const user = await this.queries.findUserByEmail(email);

    if (!user) {
      await hash.make(password);
      throw new auth.E_INVALID_CREDENTIALS("Invalid user credentials.");
    }

    if (!user.password) {
      throw new RuntimeException("Cannot verify undefined password. Account cannot be accessed.");
    }

    const verified = await hash.verify(user.password, password);

    if (!verified) {
      throw new auth.E_INVALID_CREDENTIALS("Invalid user credentials.");
    }

    const userWithRoles = await this.queries.findUserWithRoles(user.id);
    if (!userWithRoles) {
      throw new RuntimeException("User not found after successful authentication.");
    }

    return userWithRoles;
  }
}
