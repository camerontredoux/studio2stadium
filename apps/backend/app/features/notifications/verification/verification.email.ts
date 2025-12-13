import type SignupEvent from "#features/users/signup/signup.event";
import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";

export default class VerificationEmail extends BaseMail {
  subject = "Verify your email";

  constructor(private event: SignupEvent) {
    super();
  }

  prepare() {
    this.message.to(
      env.get("NODE_ENV") === "development" ? "camtredoux@gmail.com" : this.event.user.display_email
    );
  }
}
