import { BaseMail } from "@adonisjs/mail";

interface ContactUsEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default class ContactUsEmail extends BaseMail {
  subject: string;

  constructor(private data: ContactUsEmailData) {
    super();
    this.subject = `Contact Form: ${data.subject}`;
  }

  prepare() {
    const { name, email, subject, message } = this.data;

    this.message.to("info@studio2stadium.com");
    this.message.replyTo(email);
    this.message.html(
      `<h2>Contact Form Submission</h2>
<p><strong>From:</strong> ${name} (${email})</p>
<p><strong>Subject:</strong> ${subject}</p>
<hr>
<p>${message.replace(/\n/g, "<br>")}</p>`
    );
    this.message.text(
      `Contact Form Submission

From: ${name} (${email})
Subject: ${subject}

${message}`
    );
  }
}
