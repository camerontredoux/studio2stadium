import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import {
  EventTierPurchaseDeactivatedEmail,
  renderEmail,
  renderEmailText,
  type EventTierPurchaseDeactivatedEmailProps,
} from "@stos/emails";

export type PurchaseDeactivatedEmailData =
  EventTierPurchaseDeactivatedEmailProps;

/**
 * To the Studio 2 Stadium team, at the same inbox feedback goes to: a paid Org
 * Event was refunded or disputed and has been stood down.
 */
export default class PurchaseDeactivatedEmail extends BaseMail {
  subject: string;

  constructor(private data: PurchaseDeactivatedEmailData) {
    super();
    this.subject = `Org Event ${data.reason}: ${data.eventName} (${data.orgName}) was deactivated`;
  }

  async prepare() {
    const template = EventTierPurchaseDeactivatedEmail(this.data);

    this.message.to(env.get("MAIL_TO_ADDRESS"));
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
