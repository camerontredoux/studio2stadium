/**
 * Not wired to any handler — kept for possible future use. In-app notifications
 * already cover new schools; broadcasting this email would duplicate thousands of sends.
 */
import { BaseMail } from "@adonisjs/mail";
import { renderEmail, renderEmailText, SchoolJoinedEmail } from "@stos/emails";

interface SchoolJoinedEmailData {
  dancerEmail: string;
  dancerName: string;
  upgradeUrl: string;
}

export default class SchoolJoinedEmailMail extends BaseMail {
  subject = "A new school just joined Studio 2 Stadium";

  constructor(private data: SchoolJoinedEmailData) {
    super();
  }

  async prepare() {
    const { dancerEmail, dancerName, upgradeUrl } = this.data;

    const template = SchoolJoinedEmail({ dancerName, upgradeUrl });

    this.message.to(dancerEmail);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
