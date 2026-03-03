import { BaseMail } from "@adonisjs/mail";

interface DeleteFeedbackEmailData {
  userId: string;
  userEmail: string;
  userName: string;
  feedback?: string;
}

export default class DeleteFeedbackEmail extends BaseMail {
  subject = "Account Deleted";

  constructor(private data: DeleteFeedbackEmailData) {
    super();
  }

  prepare() {
    const { userId, userEmail, userName, feedback } = this.data;

    this.message.to("info@studio2stadium.com");
    this.message.html(
      `<h2>Account Deleted</h2>
<p><strong>User:</strong> ${userName} (${userEmail})</p>
<p><strong>User ID:</strong> ${userId}</p>
${feedback ? `<hr><p><strong>Feedback:</strong></p><p>${feedback.replace(/\n/g, "<br>")}</p>` : "<p><em>No feedback provided</em></p>"}`
    );
    this.message.text(
      `Account Deleted

User: ${userName} (${userEmail})
User ID: ${userId}

${feedback ? `Feedback:\n${feedback}` : "No feedback provided"}`
    );
  }
}
