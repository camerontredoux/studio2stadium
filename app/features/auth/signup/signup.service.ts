import hash from "@adonisjs/core/services/hash";
import { inject } from "@adonisjs/core";
import { UserRepository } from "#repositories/user.repository";
import { normalizeEmail } from "#shared/normalize-email";
import { SignupValidator } from "./signup.validator.js";

@inject()
export class SignupService {
  constructor(private repo: UserRepository) {}

  async execute({ first_name, last_name, password, username, email }: SignupValidator) {
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
