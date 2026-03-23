import { BaseMail } from "@adonisjs/mail";
import {
  renderEmail,
  renderEmailText,
  PremiumWelcomeEmail,
} from "@stos/emails";

interface PremiumWelcomeEmailData {
  email: string;
  firstName: string;
}

export default class PremiumWelcomeEmailMail extends BaseMail {
  subject = "Welcome to Studio2Stadium Premium!";

  constructor(private data: PremiumWelcomeEmailData) {
    super();
  }

  async prepare() {
    const { email, firstName } = this.data;

    const template = PremiumWelcomeEmail({ firstName });

    this.message.to(email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
