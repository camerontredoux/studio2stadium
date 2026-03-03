import { BaseMail } from "@adonisjs/mail";

interface ForgotPasswordEmailData {
  email: string;
  resetUrl: string;
}

export default class ForgotPasswordEmail extends BaseMail {
  subject = "Reset your password";

  constructor(private data: ForgotPasswordEmailData) {
    super();
  }

  prepare() {
    const { email, resetUrl } = this.data;

    this.message.to(email);
    this.message.html(
      `<p>You requested a password reset.</p>
<p>Visit <a href="${resetUrl}">this link</a> to reset your password.</p>
<p>This link will expire in 15 minutes.</p>
<p>If you didn't request this, you can safely ignore this email.</p>`
    );
    this.message.text(
      `You requested a password reset.

Visit ${resetUrl} to reset your password.

This link will expire in 15 minutes.

If you didn't request this, you can safely ignore this email.`
    );
  }
}
