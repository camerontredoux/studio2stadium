import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import {
  ApplicationSubmittedEmail,
  renderEmail,
  renderEmailText,
} from "@stos/emails";

export const DEFAULT_APPLICATION_ALERT_EMAIL = "abbey@studio2stadium.com";

interface ApplicationSubmittedEmailData {
  schoolName: string;
  applicantName: string;
  applicantEmail: string;
  submittedAt: Date;
}

export default class ApplicationSubmittedEmailMail extends BaseMail {
  subject: string;

  constructor(private data: ApplicationSubmittedEmailData) {
    super();
    this.subject = `New school application: ${data.schoolName}`;
  }

  async prepare() {
    const { schoolName, applicantName, applicantEmail, submittedAt } =
      this.data;

    const submittedAtEt = submittedAt.toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const template = ApplicationSubmittedEmail({
      schoolName,
      applicantName,
      applicantEmail,
      submittedAt: `${submittedAtEt} ET`,
      applicationsUrl: `${env.get("SITE_URL")}/admin/applications`,
    });

    this.message.to(
      env.get("APPLICATION_ALERT_EMAIL") ?? DEFAULT_APPLICATION_ALERT_EMAIL
    );
    this.message.replyTo(applicantEmail);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
