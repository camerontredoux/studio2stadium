import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import {
  ProspectStatusEmail,
  renderEmail,
  renderEmailText,
} from "@stos/emails";

interface ProspectStatusEmailData {
  dancerEmail: string;
  dancerName: string;
  schoolName: string;
  status: string;
}

export default class ProspectStatusEmailMail extends BaseMail {
  subject: string;

  constructor(private data: ProspectStatusEmailData) {
    super();
    this.subject = `Common Recruiting Update from ${data.schoolName}`;
  }

  async prepare() {
    const { dancerEmail, dancerName, schoolName, status } = this.data;
    const submissionsUrl = `${env.get("SITE_URL")}/recruiting`;

    const template = ProspectStatusEmail({
      dancerName,
      schoolName,
      status: status as "released" | "in_review" | "accepted",
      submissionsUrl,
    });

    this.message.to(dancerEmail);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
