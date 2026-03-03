import { BaseMail } from "@adonisjs/mail";

interface ProfileViewedEmailData {
  dancerEmail: string;
  dancerName: string;
  schoolName: string;
  schoolProfileUrl: string;
}

export default class ProfileViewedEmail extends BaseMail {
  subject: string;

  constructor(private data: ProfileViewedEmailData) {
    super();
    this.subject = `${data.schoolName} viewed your profile!`;
  }

  prepare() {
    const { dancerEmail, dancerName, schoolName, schoolProfileUrl } = this.data;

    this.message.to(dancerEmail);
    this.message.html(
      `<p>Hi ${dancerName},</p>
<p>Great news! <strong>${schoolName}</strong> just viewed your profile on Studio2Stadium.</p>
<p><a href="${schoolProfileUrl}">View their program</a></p>`
    );
    this.message.text(
      `Hi ${dancerName},

Great news! ${schoolName} just viewed your profile on Studio2Stadium.

View their program: ${schoolProfileUrl}`
    );
  }
}
