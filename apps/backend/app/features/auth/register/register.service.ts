import hash from "@adonisjs/core/services/hash";
import type { RegisterValidator } from "./register.validator.js";
import { inject } from "@adonisjs/core";
import { UserRepository } from "#repositories/user.repository";
import { normalizeEmail } from "#shared/normalize-email";

@inject()
export class RegisterService {
  constructor(private repo: UserRepository) {}

  async execute({ first_name, last_name, password, username, email }: RegisterValidator) {
    return await this.repo.create({
      email: await normalizeEmail(email),
      display_email: email,
      username,
      first_name,
      last_name,
      password: await hash.make(password),
    });
  }
}
