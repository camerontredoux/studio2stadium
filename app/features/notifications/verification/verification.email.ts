import SignupEvent from "#features/auth/signup/signup.event";
import { BaseMail } from "@adonisjs/mail";

export default class VerificationEmail extends BaseMail {
  subject = "Verify your email";

  constructor(private event: SignupEvent) {
    super();
  }

  prepare() {
    this.message.to(this.event.user.display_email);
  }
}
