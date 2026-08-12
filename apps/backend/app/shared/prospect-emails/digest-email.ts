import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import {
  ProspectSubmissionsDigestEmail,
  renderEmail,
  renderEmailText,
  type DigestDancer,
} from "@stos/emails";
import { unsubscribeUrl } from "./unsubscribe-token.ts";

interface ProspectDigestMailData {
  email: string;
  userId: string;
  schoolName: string;
  newSubmissions: DigestDancer[];
  earlySubmissions: DigestDancer[];
}

export class ProspectDigestMail extends BaseMail {
  subject = "Your Studio 2 Stadium Recruiting Submissions";

  constructor(private data: ProspectDigestMailData) {
    super();
  }

  async prepare() {
    const siteUrl = env.get("SITE_URL").replace(/\/$/, "");
    const template = ProspectSubmissionsDigestEmail({
      schoolName: this.data.schoolName,
      newSubmissions: this.data.newSubmissions,
      earlySubmissions: this.data.earlySubmissions,
      reviewUrl: `${siteUrl}/school/common-recruiting-videos`,
    });

    this.message.to(this.data.email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));

    // RFC 8058: one-click unsubscribe. Both headers are required — mailbox
    // providers ignore List-Unsubscribe-Post without List-Unsubscribe.
    // Built from API_URL, not SITE_URL: the route is on this backend, and
    // providers POST to it unauthenticated.
    const url = unsubscribeUrl(env.get("API_URL"), this.data.userId);
    this.message.header("List-Unsubscribe", `<${url}>`);
    this.message.header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
  }
}
