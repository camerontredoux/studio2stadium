import { BaseMail } from "@adonisjs/mail";
import {
  renderEmail,
  renderEmailText,
  SchoolRejectedEmail,
} from "@stos/emails";

interface SchoolRejectedEmailData {
  email: string;
  firstName: string;
  schoolName: string;
  reason?: string;
}

export default class SchoolRejectedEmailMail extends BaseMail {
  subject = "Update on your Studio 2 Stadium application";

  constructor(private data: SchoolRejectedEmailData) {
    super();
  }

  async prepare() {
    const { email, firstName, schoolName, reason } = this.data;

    const template = SchoolRejectedEmail({
      firstName,
      schoolName,
      reason,
    });

    this.message.to(email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
