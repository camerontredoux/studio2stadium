import type { SessionUser } from "#auth/provider";
import { findUserByEmail, findUserWithRoles } from "#auth/queries";
import { errors as auth } from "@adonisjs/auth";
import { inject } from "@adonisjs/core";
import { RuntimeException } from "@adonisjs/core/exceptions";
import hash from "@adonisjs/core/services/hash";
import type { LoginValidator } from "./validator.ts";

@inject()
export class LoginService {
  async execute({ email, password }: LoginValidator): Promise<SessionUser> {
    const user = await findUserByEmail(email);

    if (!user) {
      await hash.make(password);
      throw new auth.E_INVALID_CREDENTIALS("Invalid user credentials.");
    }

    if (!user.password) {
      throw new RuntimeException(
        "Cannot verify undefined password. Account cannot be accessed."
      );
    }

    const verified = await hash.verify(user.password, password);

    if (!verified) {
      throw new auth.E_INVALID_CREDENTIALS("Invalid user credentials.");
    }

    const userWithRoles = await findUserWithRoles(user.id);
    if (!userWithRoles) {
      throw new RuntimeException(
        "User not found after successful authentication."
      );
    }

    return userWithRoles;
  }
}
