import { BaseMail } from "@adonisjs/mail";

interface ShowInterestEmailData {
  schoolEmail: string;
  schoolName: string;
  dancerName: string;
  dancerProfileUrl: string;
  interestCount: number;
}

export default class ShowInterestEmail extends BaseMail {
  subject: string;

  constructor(private data: ShowInterestEmailData) {
    super();
    this.subject = `${data.dancerName} is interested in ${data.schoolName}!`;
  }

  prepare() {
    const {
      schoolEmail,
      schoolName,
      dancerName,
      dancerProfileUrl,
      interestCount,
    } = this.data;

    const countText =
      interestCount === 1
        ? "This is their first time showing interest"
        : `They've shown interest ${interestCount} times`;

    this.message.to(schoolEmail);
    this.message.html(
      `<p>Great news!</p>
<p><strong>${dancerName}</strong> just showed interest in <strong>${schoolName}</strong>.</p>
<p>${countText}.</p>
<p><a href="${dancerProfileUrl}">View their profile</a></p>`
    );
    this.message.text(
      `Great news!

${dancerName} just showed interest in ${schoolName}.

${countText}.

View their profile: ${dancerProfileUrl}`
    );
  }
}
