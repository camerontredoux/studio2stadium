import { normalizeEmail } from "#utils/normalize-email";
import { inject } from "@adonisjs/core";
import hash from "@adonisjs/core/services/hash";
import UserRegistered from "./event.ts";
import { SignupQueries } from "./queries.ts";
import type { SignupValidator } from "./validator.ts";

@inject()
export class SignupService {
  constructor(private queries: SignupQueries) {}

  async execute({
    email,
    password,
    firstName,
    lastName,
    username,
    phone,
  }: SignupValidator) {
    const user = await this.queries.createUser({
      email: await normalizeEmail(email),
      display_email: email,
      password: await hash.make(password),
      first_name: firstName,
      last_name: lastName,
      username,
      phone,
    });

    UserRegistered.dispatch(user);

    return user;
  }
}
