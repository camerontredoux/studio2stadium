import type { SignupEvent } from "#modules/auth/signup/event";
import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";

export default class VerificationEmail extends BaseMail {
  subject = "Welcome to Studio2Stadium - Verify your email";

  constructor(private event: SignupEvent) {
    super();
  }

  prepare() {
    const { user } = this.event;
    const verifyUrl = `${env.get("SITE_URL")}/verify?userId=${user.id}`;

    this.message.to(user.displayEmail);
    this.message.html(
      `<p>Hi ${user.firstName},</p>
<p>Welcome to Studio2Stadium! Please verify your email by clicking the link below:</p>
<p><a href="${verifyUrl}">Verify Email</a></p>
<p>If you didn't create this account, you can safely ignore this email.</p>`
    );
    this.message.text(
      `Hi ${user.firstName},

Welcome to Studio2Stadium! Please verify your email by visiting:
${verifyUrl}

If you didn't create this account, you can safely ignore this email.`
    );
  }
}
