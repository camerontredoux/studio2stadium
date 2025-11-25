import { errors as auth } from "@adonisjs/auth";
import { RuntimeException } from "@adonisjs/core/exceptions";
import hash from "@adonisjs/core/services/hash";
import type { LoginValidator } from "./login.validator.js";
import { UserRepository } from "#repositories/user.repository";
import { inject } from "@adonisjs/core";
import limiter from "@adonisjs/limiter/services/main";
import { errors } from "@adonisjs/limiter";

@inject()
export class LoginService {
  constructor(private repo: UserRepository) {}

  async execute({ email, password }: LoginValidator, ip: string) {
    const loginLimiter = limiter.use({
      requests: 5,
      duration: "1 min",
      blockDuration: "5 mins",
    });

    const key = `login:${ip}:${email}`;

    const [error, user] = await loginLimiter.penalize(key, () => {
      return this.verify(email, password);
    });

    if (error) {
      throw new errors.E_TOO_MANY_REQUESTS(error.response);
    }

    return user;
  }

  async verify(email: string, password: string) {
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
