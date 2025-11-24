import hash from "@adonisjs/core/services/hash";
import type { RegisterValidator } from "./register.validator.js";
import { inject } from "@adonisjs/core";
import { UsersRepository } from "#repositories/users.repository";

@inject()
export class RegisterService {
  constructor(private repo: UsersRepository) {}

  async execute({ firstName, lastName, password, ...rest }: RegisterValidator) {
    return await this.repo.create({
      first_name: firstName,
      last_name: lastName,
      password_hash: await hash.make(password),
      image: "",
      ...rest,
    });
  }
}
