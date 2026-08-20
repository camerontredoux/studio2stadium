import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import {
  ProspectReminderEmail,
  renderEmail,
  renderEmailText,
} from "@stos/emails";
import { unsubscribeUrl } from "./unsubscribe-token.ts";

interface ProspectReminderMailData {
  email: string;
  userId: string;
}

export class ProspectReminderMail extends BaseMail {
  subject = "Quick Reminder: Update Your Prospect Statuses";

  constructor(private data: ProspectReminderMailData) {
    super();
  }

  async prepare() {
    const siteUrl = env.get("SITE_URL").replace(/\/$/, "");
    // Built from API_URL, not SITE_URL: the route is on this backend, and
    // providers POST to it unauthenticated.
    const url = unsubscribeUrl(env.get("API_URL"), this.data.userId);
    const template = ProspectReminderEmail({
      reviewUrl: `${siteUrl}/recruiting`,
      unsubscribeUrl: url,
    });

    this.message.to(this.data.email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));

    // RFC 8058: one-click unsubscribe. Both headers are required — mailbox
    // providers ignore List-Unsubscribe-Post without List-Unsubscribe.
    this.message.header("List-Unsubscribe", `<${url}>`);
    this.message.header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
  }
}
