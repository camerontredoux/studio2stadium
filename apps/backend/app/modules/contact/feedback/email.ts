import { BaseMail } from "@adonisjs/mail";

interface FeedbackEmailData {
  type: "bug" | "feature" | "improvement" | "other";
  message: string;
  page?: string;
  userId: string;
  userEmail: string;
  userName: string;
}

export default class FeedbackEmail extends BaseMail {
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

  prepare() {
    const { type, message, page, userId, userEmail, userName } = this.data;

    const typeLabels = {
      bug: "Bug Report",
      feature: "Feature Request",
      improvement: "Improvement Suggestion",
      other: "Feedback",
    };

    this.message.to("info@studio2stadium.com");
    this.message.replyTo(userEmail);
    this.message.html(
      `<h2>${typeLabels[type]}</h2>
<p><strong>From:</strong> ${userName} (${userEmail})</p>
<p><strong>User ID:</strong> ${userId}</p>
${page ? `<p><strong>Page:</strong> ${page}</p>` : ""}
<hr>
<p>${message.replace(/\n/g, "<br>")}</p>`
    );
    this.message.text(
      `${typeLabels[type]}

From: ${userName} (${userEmail})
User ID: ${userId}
${page ? `Page: ${page}` : ""}

${message}`
    );
  }
}
