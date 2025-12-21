import hash from "@adonisjs/core/services/hash";
import { inject } from "@adonisjs/core";
import { normalizeEmail } from "#shared/normalize-email";
import type { SignupValidator } from "./signup.validator.ts";
import UserRegistered from "./signup.event.ts";
import { SignupQueries } from "./signup.queries.ts";

@inject()
export class SignupService {
  constructor(private queries: SignupQueries) {}

  async execute({ email, password, firstName, lastName, username, phone }: SignupValidator) {
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
