import type { SignupEvent } from "#modules/auth/signup/event";
import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import { renderEmail, renderEmailText, VerificationEmail } from "@stos/emails";

export default class VerificationEmailMail extends BaseMail {
  subject = "Welcome to Studio2Stadium - Verify your email";

  constructor(private event: SignupEvent) {
    super();
  }

  async prepare() {
    const { user } = this.event;
    const verifyUrl = `${env.get("SITE_URL")}/verify?userId=${user.id}`;

    const template = VerificationEmail({
      firstName: user.firstName,
      verifyUrl,
    });

    this.message.to(user.displayEmail);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
