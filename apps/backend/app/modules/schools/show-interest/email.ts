import { BaseMail } from "@adonisjs/mail";
import { renderEmail, renderEmailText, ShowInterestEmail } from "@stos/emails";

interface ShowInterestEmailData {
  schoolEmail: string;
  schoolName: string;
  dancerName: string;
  dancerProfileUrl: string;
  interestCount: number;
}

export default class ShowInterestEmailMail extends BaseMail {
  subject: string;

  constructor(private data: ShowInterestEmailData) {
    super();
    this.subject = `${data.dancerName} is interested in ${data.schoolName}!`;
  }

  async prepare() {
    const {
      schoolEmail,
      schoolName,
      dancerName,
      dancerProfileUrl,
      interestCount,
    } = this.data;

    const template = ShowInterestEmail({
      schoolName,
      dancerName,
      dancerProfileUrl,
      interestCount,
    });

    this.message.to(schoolEmail);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
