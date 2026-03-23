import { BaseMail } from "@adonisjs/mail";
import {
  renderEmail,
  renderEmailText,
  ForgotPasswordEmail,
} from "@stos/emails";

interface ForgotPasswordEmailData {
  email: string;
  resetUrl: string;
}

export default class ForgotPasswordEmailMail extends BaseMail {
  subject = "Reset your password";

  constructor(private data: ForgotPasswordEmailData) {
    super();
  }

  async prepare() {
    const { email, resetUrl } = this.data;

    const template = ForgotPasswordEmail({ resetUrl });

    this.message.to(email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
