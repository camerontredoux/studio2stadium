import app from "@adonisjs/core/services/app";
import { BaseMail } from "@adonisjs/mail";
import {
  DeleteFeedbackEmail,
  renderEmail,
  renderEmailText,
} from "@stos/emails";

interface DeleteFeedbackEmailData {
  userId: string;
  userEmail: string;
  userName: string;
  feedback?: string;
}

export default class DeleteFeedbackEmailMail extends BaseMail {
  subject = "Account Deleted";

  constructor(private data: DeleteFeedbackEmailData) {
    super();
  }

  async prepare() {
    const { userId, userEmail, userName, feedback } = this.data;

    const template = DeleteFeedbackEmail({
      userId,
      userEmail,
      userName,
      feedback,
    });

    this.message.to(
      app.inProduction ? "info@studio2stadium.com" : "camtredoux@gmail.com"
    );
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
