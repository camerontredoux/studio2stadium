import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import { renderEmail, renderEmailText, DancerWelcomeEmail } from "@stos/emails";

interface DancerWelcomeEmailData {
  email: string;
  firstName: string;
}

export default class DancerWelcomeEmailMail extends BaseMail {
  subject = "Welcome to Studio2Stadium - Let's get you recruited!";

  constructor(private data: DancerWelcomeEmailData) {
    super();
  }

  async prepare() {
    const { email, firstName } = this.data;
    const profileUrl = `${env.get("SITE_URL")}/profile`;

    const template = DancerWelcomeEmail({ firstName, profileUrl });

    this.message.to(email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
