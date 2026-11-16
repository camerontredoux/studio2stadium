import { unsubscribeUrl as buildUnsubscribeUrl } from "#shared/prospect-emails/unsubscribe-token";
import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import {
  renderEmail,
  renderEmailText,
  WeekPassExpiredEmail,
  WeekPassWelcomeEmail,
  type WeekPassWelcomeVariant,
} from "@stos/emails";
import { formatEmailDate } from "./schedule.ts";

/**
 * Proposed subjects, pending review. They are not part of the approved
 * designs.
 */
export const WEEK_PASS_SUBJECTS = {
  welcome: {
    current: "Your S2S Week Pass starts now",
    queued: "Your next S2S Week Pass is lined up",
  },
  expired: "Your S2S Week Pass has ended",
} as const;

interface Recipient {
  userId: string;
  email: string;
  firstName: string | null;
}

interface Footer {
  postalAddress: string;
  assetBaseUrl: string;
}

function links(userId: string) {
  const siteUrl = env.get("SITE_URL").replace(/\/$/, "");
  return {
    siteUrl,
    // The in-app switch the existing unsubscribe link also turns off.
    preferencesUrl: `${siteUrl}/settings/account`,
    // On this backend (API_URL), where providers POST the one-click request.
    unsubscribeUrl: buildUnsubscribeUrl(env.get("API_URL"), userId),
  };
}

/**
 * React Email's plain-text render keeps the inbox preview's invisible padding
 * and the blank lines left by layout tables; drop both.
 */
export function cleanPlainText(text: string): string {
  return text
    .replace(/[\u00A0\u034F\u200B-\u200F\uFEFF]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function addUnsubscribeHeaders(mail: BaseMail, url: string) {
  // RFC 8058 one-click: both headers, or providers ignore them.
  mail.message.header("List-Unsubscribe", `<${url}>`);
  mail.message.header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
}

export interface WeekPassWelcomeMailData extends Recipient, Footer {
  username: string;
  variant: WeekPassWelcomeVariant;
  startsAt: Date;
  accessEndsAt: Date;
  timezone: string;
}

/**
 * Onboarding for a pass the Dancer bought. It sells nothing, but it is not a
 * receipt either, so it honors the same opt-outs and carries the same
 * unsubscribe link, headers and postal address as promotional mail.
 */
export class WeekPassWelcomeMail extends BaseMail {
  subject: string;

  constructor(public data: WeekPassWelcomeMailData) {
    super();
    this.subject = WEEK_PASS_SUBJECTS.welcome[data.variant];
  }

  async prepare() {
    const { siteUrl, preferencesUrl, unsubscribeUrl } = links(this.data.userId);
    const template = WeekPassWelcomeEmail({
      variant: this.data.variant,
      firstName: this.data.firstName,
      startsAt: formatEmailDate(this.data.startsAt, this.data.timezone),
      accessEndsAt: formatEmailDate(this.data.accessEndsAt, this.data.timezone),
      profileUrl: `${siteUrl}/${encodeURIComponent(this.data.username)}`,
      preferencesUrl,
      unsubscribeUrl,
      postalAddress: this.data.postalAddress,
      assetBaseUrl: this.data.assetBaseUrl,
    });

    this.message.to(this.data.email);
    this.message.html(await renderEmail(template));
    this.message.text(cleanPlainText(await renderEmailText(template)));
    addUnsubscribeHeaders(this, unsubscribeUrl);
  }
}

export interface WeekPassExpiredMailData extends Recipient, Footer {}

/** Promotional: it advertises Premium to a Dancer whose pass ran out. */
export class WeekPassExpiredMail extends BaseMail {
  subject = WEEK_PASS_SUBJECTS.expired;

  constructor(public data: WeekPassExpiredMailData) {
    super();
  }

  async prepare() {
    const { siteUrl, preferencesUrl, unsubscribeUrl } = links(this.data.userId);
    const template = WeekPassExpiredEmail({
      firstName: this.data.firstName,
      // The app's plan picker ("Choose Your Plan"). It admits a lapsed Week
      // Pass holder; someone already on Premium is sent on to their feed.
      plansUrl: `${siteUrl}/checkout`,
      preferencesUrl,
      unsubscribeUrl,
      postalAddress: this.data.postalAddress,
      assetBaseUrl: this.data.assetBaseUrl,
    });

    this.message.to(this.data.email);
    this.message.html(await renderEmail(template));
    this.message.text(cleanPlainText(await renderEmailText(template)));
    addUnsubscribeHeaders(this, unsubscribeUrl);
  }
}
