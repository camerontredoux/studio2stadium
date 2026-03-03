import { BaseMail } from "@adonisjs/mail";

interface PremiumWelcomeEmailData {
  email: string;
  firstName: string;
}

export default class PremiumWelcomeEmail extends BaseMail {
  subject = "Welcome to Studio2Stadium Premium!";

  constructor(private data: PremiumWelcomeEmailData) {
    super();
  }

  prepare() {
    const { email, firstName } = this.data;

    this.message.to(email);
    this.message.html(
      `<p>Hi ${firstName},</p>
<p>Welcome to Studio2Stadium Premium! 🎉</p>
<p>You now have access to all premium features including:</p>
<ul>
  <li>Show interest to unlimited schools</li>
  <li>Priority profile visibility</li>
  <li>Advanced search filters</li>
  <li>Direct messaging with coaches</li>
</ul>
<p>Start exploring your new features today!</p>`
    );
    this.message.text(
      `Hi ${firstName},

Welcome to Studio2Stadium Premium!

You now have access to all premium features including:
- Show interest to unlimited schools
- Priority profile visibility
- Advanced search filters
- Direct messaging with coaches

Start exploring your new features today!`
    );
  }
}
