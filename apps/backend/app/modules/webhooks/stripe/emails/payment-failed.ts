import { BaseMail } from "@adonisjs/mail";
import { PaymentFailedEmail, renderEmail, renderEmailText } from "@stos/emails";
import env from "#start/env";
import { formatBillingDate } from "#utils/date";

interface PaymentFailedEmailData {
  email: string;
  firstName: string;
  accessEndsAt: Date;
}

export default class PaymentFailedEmailMail extends BaseMail {
  subject = "Your Studio2Stadium payment didn't go through";

  constructor(private data: PaymentFailedEmailData) {
    super();
  }

  async prepare() {
    const { email, firstName, accessEndsAt } = this.data;

    const template = PaymentFailedEmail({
      firstName,
      accessEndsOn: formatBillingDate(accessEndsAt),
      membershipUrl: `${env.get("SITE_URL")}/settings/membership`,
    });

    this.message.to(email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
