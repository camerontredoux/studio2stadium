import { BaseMail } from "@adonisjs/mail";
import {
  renderEmail,
  renderEmailText,
  SubscriptionEndedEmail,
} from "@stos/emails";
import env from "#start/env";

interface SubscriptionEndedEmailData {
  email: string;
  firstName: string;
}

export default class SubscriptionEndedEmailMail extends BaseMail {
  subject = "Your Studio2Stadium Premium subscription has ended";

  constructor(private data: SubscriptionEndedEmailData) {
    super();
  }

  async prepare() {
    const { email, firstName } = this.data;

    const upgradeUrl = `${env.get("SITE_URL")}/settings/membership`;

    const template = SubscriptionEndedEmail({ firstName, upgradeUrl });

    this.message.to(email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
