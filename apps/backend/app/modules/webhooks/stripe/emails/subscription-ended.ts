import { BaseMail } from "@adonisjs/mail";

interface SubscriptionEndedEmailData {
  email: string;
  firstName: string;
}

export default class SubscriptionEndedEmail extends BaseMail {
  subject = "Your Studio2Stadium Premium subscription has ended";

  constructor(private data: SubscriptionEndedEmailData) {
    super();
  }

  prepare() {
    const { email, firstName } = this.data;

    this.message.to(email);
    this.message.html(
      `<p>Hi ${firstName},</p>
<p>Your Studio2Stadium Premium subscription has ended.</p>
<p>If you didn't delete your account, you still have access to our service, but premium features are no longer available.</p>
<p>If you'd like to reactivate your subscription, you can do so anytime from your account settings.</p>
<p>Thank you for being a premium member!</p>`
    );
    this.message.text(
      `Hi ${firstName},

Your Studio2Stadium Premium subscription has ended.

If you didn't delete your account, you still have access to our service, but premium features are no longer available.

If you'd like to reactivate your subscription, you can do so anytime from your account settings.

Thank you for being a premium member!`
    );
  }
}
