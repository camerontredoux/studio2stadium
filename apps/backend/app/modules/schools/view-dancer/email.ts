import { BaseMail } from "@adonisjs/mail";
import { renderEmail, renderEmailText, ProfileViewedEmail } from "@stos/emails";

interface ProfileViewedEmailData {
  dancerEmail: string;
  dancerName: string;
  schoolName: string;
  schoolProfileUrl: string;
  schoolLogoUrl?: string;
  freemium?: boolean;
  upgradeUrl?: string;
}

export default class ProfileViewedEmailMail extends BaseMail {
  subject: string;

  constructor(private data: ProfileViewedEmailData) {
    super();
    this.subject = data.freemium
      ? "Someone viewed your profile"
      : `${data.schoolName} viewed your profile!`;
  }

  async prepare() {
    const {
      dancerEmail,
      dancerName,
      schoolName,
      schoolProfileUrl,
      schoolLogoUrl,
      freemium,
      upgradeUrl,
    } = this.data;

    const template = ProfileViewedEmail({
      dancerName,
      schoolName,
      schoolProfileUrl,
      schoolLogoUrl,
      freemium,
      upgradeUrl,
    });

    this.message.to(dancerEmail);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
