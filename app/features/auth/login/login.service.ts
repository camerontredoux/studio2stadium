import { errors as auth } from "@adonisjs/auth";
import { RuntimeException } from "@adonisjs/core/exceptions";
import hash from "@adonisjs/core/services/hash";
import type { LoginValidator } from "./login.validator.js";
import { UserRepository } from "#repositories/user/user.repository";
import { inject } from "@adonisjs/core";

@inject()
export class LoginService {
  constructor(private repo: UserRepository) {}

  async execute({ email, password }: LoginValidator) {
    const user = await this.repo.findByEmail(email);

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

    return user;
  }
}
