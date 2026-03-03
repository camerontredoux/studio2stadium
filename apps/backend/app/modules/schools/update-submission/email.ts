import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";

interface ProspectStatusEmailData {
  dancerEmail: string;
  dancerName: string;
  schoolName: string;
  status: string;
}

export default class ProspectStatusEmail extends BaseMail {
  subject: string;

  constructor(private data: ProspectStatusEmailData) {
    super();
    this.subject = `Common Recruiting Update from ${data.schoolName}`;
  }

  prepare() {
    const { dancerEmail, dancerName, schoolName, status } = this.data;

    const statusMessages: Record<string, string> = {
      in_review: "is now reviewing your submission",
      accepted: "has moved you forward in their recruiting process",
      released: "has updated your status",
    };

    const statusText = statusMessages[status] || "has updated your status";

    this.message.to(dancerEmail);
    this.message.html(
      `<p>Hi ${dancerName},</p>
<p><strong>${schoolName}</strong> ${statusText}.</p>
<p><a href="${env.get("SITE_URL")}/recruiting" target="_blank">View your submissions</a> on Studio2Stadium to see more details.</p>`
    );
    this.message.text(
      `Hi ${dancerName},

${schoolName} ${statusText}.

View your submissions on Studio2Stadium to see more details: ${env.get("SITE_URL")}/recruiting`
    );
  }
}
