import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";
import { renderEmail, renderEmailText, FeedbackEmail } from "@stos/emails";

interface FeedbackEmailData {
  type: "bug" | "feature" | "improvement" | "other";
  message: string;
  page?: string;
  userId: string;
  userEmail: string;
  userName: string;
}

export default class FeedbackEmailMail extends BaseMail {
  subject: string;

  constructor(private data: FeedbackEmailData) {
    super();
    const typeLabels = {
      bug: "Bug Report",
      feature: "Feature Request",
      improvement: "Improvement Suggestion",
      other: "Feedback",
    };
    this.subject = `${typeLabels[data.type]} from ${data.userName}`;
  }

  async prepare() {
    const { type, message, page, userId, userEmail, userName } = this.data;

    const template = FeedbackEmail({
      type,
      message,
      page,
      userId,
      userEmail,
      userName,
    });

    this.message.to(env.get("MAIL_TO_ADDRESS"));
    this.message.replyTo(userEmail);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
