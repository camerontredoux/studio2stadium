import type { SignupEvent } from "#modules/auth/signup/event";
import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";

export default class VerificationEmail extends BaseMail {
  subject = "Verify your email";

  constructor(private event: SignupEvent) {
    super();
  }

  prepare() {
    this.message.to(
      env.get("ENV") === "development"
        ? "camtredoux@gmail.com"
        : this.event.user.displayEmail
    );
  }
}
