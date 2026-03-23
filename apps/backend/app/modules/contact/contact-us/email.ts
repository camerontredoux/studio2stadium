import { BaseMail } from "@adonisjs/mail";
import { renderEmail, renderEmailText, ContactUsEmail } from "@stos/emails";

interface ContactUsEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default class ContactUsEmailMail extends BaseMail {
  subject: string;

  constructor(private data: ContactUsEmailData) {
    super();
    this.subject = `Contact Form: ${data.subject}`;
  }

  async prepare() {
    const { name, email, subject, message } = this.data;

    const template = ContactUsEmail({ name, email, subject, message });

    this.message.to("info@studio2stadium.com");
    this.message.replyTo(email);
    this.message.html(await renderEmail(template));
    this.message.text(await renderEmailText(template));
  }
}
