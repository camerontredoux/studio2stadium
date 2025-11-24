import { errors } from "@adonisjs/auth";
import { RuntimeException } from "@adonisjs/core/exceptions";
import hash from "@adonisjs/core/services/hash";
import type { LoginValidator } from "./login.validator.js";
import { UsersRepository } from "#repositories/users.repository";
import { inject } from "@adonisjs/core";

@inject()
export class LoginService {
  constructor(private repo: UsersRepository) {}

  async execute({ email, password }: LoginValidator) {
    const user = await this.repo.findByEmail(email);

    if (!user) {
      await hash.make(password);
      throw new errors.E_INVALID_CREDENTIALS("Invalid user credentials.");
    }

    if (!user.password_hash) {
      throw new RuntimeException("Cannot verify password. Password is either undefined or null.");
    }

    if (await hash.verify(user.password_hash, password)) {
      return user;
    }

    throw new errors.E_INVALID_CREDENTIALS("Invalid user credentials.");
  }
}
