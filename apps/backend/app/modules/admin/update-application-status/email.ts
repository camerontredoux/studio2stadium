import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import { renderEmail, renderEmailText, SchoolWelcomeEmail } from "@stos/emails";

interface SchoolWelcomeEmailData {
  email: string;
  firstName: string;
  schoolName: string;
}

export default class SchoolWelcomeEmailMail extends BaseMail {
  subject = "Your school has been approved!";

  constructor(private data: SchoolWelcomeEmailData) {
    super();
  }

  async prepare() {
    const { email, firstName, schoolName } = this.data;
    const dashboardUrl = `${env.get("SITE_URL")}/dashboard`;

    const template = SchoolWelcomeEmail({
      firstName,
      schoolName,
      dashboardUrl,
    });

    this.message.to(email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
