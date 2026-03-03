import env from "#start/env";
import { BaseMail } from "@adonisjs/mail";

interface DancerWelcomeEmailData {
  email: string;
  firstName: string;
}

export default class DancerWelcomeEmail extends BaseMail {
  subject = "Welcome to Studio2Stadium - Let's get you recruited!";

  constructor(private data: DancerWelcomeEmailData) {
    super();
  }

  prepare() {
    const { email, firstName } = this.data;
    const profileUrl = `${env.get("SITE_URL")}/profile`;

    this.message.to(email);
    this.message.html(
      `<p>Hi ${firstName},</p>
<p>Welcome to Studio2Stadium! Your dancer profile has been created.</p>
<p>Here's what you can do next:</p>
<ul>
  <li>Complete your profile to stand out to coaches</li>
  <li>Upload videos and photos of your performances</li>
  <li>Browse and follow schools you're interested in</li>
  <li>Show interest to let coaches know you're available</li>
</ul>
<p><a href="${profileUrl}">Complete your profile</a></p>
<p>Good luck on your recruiting journey!</p>`
    );
    this.message.text(
      `Hi ${firstName},

Welcome to Studio2Stadium! Your dancer profile has been created.

Here's what you can do next:
- Complete your profile to stand out to coaches
- Upload videos and photos of your performances
- Browse and follow schools you're interested in
- Show interest to let coaches know you're available

Complete your profile: ${profileUrl}

Good luck on your recruiting journey!`
    );
  }
}
