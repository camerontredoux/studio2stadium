import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";

interface SchoolWelcomeEmailData {
  email: string;
  firstName: string;
  schoolName: string;
}

export default class SchoolWelcomeEmail extends BaseMail {
  subject = "Welcome to Studio2Stadium - Your school has been approved!";

  constructor(private data: SchoolWelcomeEmailData) {
    super();
  }

  prepare() {
    const { email, firstName, schoolName } = this.data;
    const dashboardUrl = `${env.get("SITE_URL")}/dashboard`;

    this.message.to(email);
    this.message.html(
      `<p>Hi ${firstName},</p>
<p>Great news! <strong>${schoolName}</strong> has been approved and is now live on Studio2Stadium.</p>
<p>You can now:</p>
<ul>
  <li>Browse and favorite talented dancers</li>
  <li>Receive notifications when dancers show interest</li>
  <li>Post events and updates for your followers</li>
  <li>Review CRV submissions from prospective dancers</li>
</ul>
<p><a href="${dashboardUrl}">Go to your dashboard</a></p>
<p>Welcome to the Studio2Stadium community!</p>`
    );
    this.message.text(
      `Hi ${firstName},

Great news! ${schoolName} has been approved and is now live on Studio2Stadium.

You can now:
- Browse and favorite talented dancers
- Receive notifications when dancers show interest
- Post events and updates for your followers
- Review CRV submissions from prospective dancers

Go to your dashboard: ${dashboardUrl}

Welcome to the Studio2Stadium community!`
    );
  }
}
