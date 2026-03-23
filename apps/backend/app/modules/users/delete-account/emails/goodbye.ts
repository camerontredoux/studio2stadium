import { BaseMail } from "@adonisjs/mail";
import { GoodbyeEmail, renderEmail, renderEmailText } from "@stos/emails";

interface GoodbyeEmailData {
  email: string;
  firstName: string;
}

export default class GoodbyeEmailMail extends BaseMail {
  subject = "We're sorry to see you go!";

  constructor(private data: GoodbyeEmailData) {
    super();
  }

  async prepare() {
    const { email, firstName } = this.data;

    const template = GoodbyeEmail({
      firstName,
      siteUrl: "https://app.studio2stadium.com/signup",
    });

    this.message.to(email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
