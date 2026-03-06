import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";

interface GoodbyeEmailData {
  email: string;
  firstName: string;
}

export default class GoodbyeEmail extends BaseMail {
  subject = "We're sorry to see you go!";

  constructor(private data: GoodbyeEmailData) {
    super();
  }

  prepare() {
    const { email, firstName } = this.data;

    this.message.to(email);
    this.message.html(
      `<p>Hi ${firstName},</p>
<p>Your Studio2Stadium account has been successfully deleted.</p>
<p>All of your data has been removed from our systems.</p>
<p>If you ever want to come back, we'd love to have you. You can create a new account anytime at <a href="${env.get("SITE_URL")}">${env.get("SITE_URL")}</a>.</p>
<p>Thank you for being part of our community.</p>
<p>Best wishes,<br>The Studio2Stadium Team</p>`
    );
    this.message.text(
      `Hi ${firstName},

Your Studio2Stadium account has been successfully deleted.

All of your data has been removed from our systems.

If you ever want to come back, we'd love to have you. You can create a new account anytime at ${env.get("SITE_URL")}.

Thank you for being part of our community.

Best wishes,
The Studio2Stadium Team`
    );
  }
}
