import { BaseMail } from "@adonisjs/mail";
import {
  EventTierOrgReadyEmail,
  renderEmail,
  renderEmailText,
  type EventTierOrgReadyEmailProps,
} from "@stos/emails";

export interface OrgReadyEmailData extends EventTierOrgReadyEmailProps {
  /** The buyer's account email. */
  to: string;
}

/**
 * To the Organizer whose purchase was just provisioned: their Org is ready,
 * and either a link to set the password of the account the purchase created,
 * a link to claim the Org for an account whose inbox nobody had proved they
 * own, or a nudge to sign in with the one they had (ADR 0007).
 */
export default class OrgReadyEmail extends BaseMail {
  subject: string;

  constructor(readonly data: OrgReadyEmailData) {
    super();
    this.subject = data.claimUrl
      ? `Your Org is ready — claim it`
      : data.setPasswordUrl
        ? `Your Org is ready — set your password`
        : `Your Org is ready — sign in`;
  }

  async prepare() {
    const { to, ...props } = this.data;
    const template = EventTierOrgReadyEmail(props);

    this.message.to(to);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
