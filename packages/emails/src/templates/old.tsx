export const StudentWelcomeMessagePremium = `<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Studio 2 Stadium</title>
    <style>
    body {
        font-family: Arial, sans-serif;
        background-color: #ffffff;
        color: #333333;
        margin: 0;
        padding: 0;
    }
    .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 5px 20px;
    }
    .header-title {
        text-align: center;
        font-size: 28px;
        margin: 20px 0;
        font-weight: 400; 
    }
    .header-title .number {
        font-weight: 700; 
    }
    h1 {
        text-align: center;
        font-size: 24px;
        margin: 12px 0;
    }
    p {
        font-size: 15px;
        line-height: 1.6;
        margin: 10px 20px;
        text-align: center;
    }
    .feature {
        display: flex;
        align-items: center; 
        margin: 30px 0;
    }
    .feature img {
        width: 36px;
        height: 36px;
        margin-right: 8px;
        flex-shrink: 0;
    }
    .feature-text {
        font-size: 15px;
        line-height: 1.6;
        text-align: left;
    }
    .feature-text b {
        display: block;
        margin-bottom: 4px;
    }
    .steps {
        padding: 0 25px 20px;
    }
    .steps-title {
        margin: 20px 0 15px;
        text-align: center;
        font-size: 22px; 
    }
    .step {
        margin: 15px 0;
    }
    .step-number {
        display: inline-block;
        vertical-align: top;
        text-align: center;
        line-height: 32px;
        border: 1px solid #000;
        border-radius: 50%;
        font-size: 14px;
        font-weight: bold;
        width: 32px;
        height: 32px;
        margin-right: 10px;
    }
    .step-text {
        display: inline-block;
        width: calc(100% - 50px);
        vertical-align: top;
        font-size: 15px;
        line-height: 1.6;
    }
    .step-text b {
        display: block;
        margin-bottom: 4px; 
    }
    .closing {
        text-align: center;
        font-size: 15px;
        line-height: 1.6;
        padding: 0 25px 30px;
    }
    .closing a {
        color: #c5a880;
        text-decoration: none;
        font-weight: bold;
    }
    .feature .feature-text a {
        color: #c5a880;
        font-weight: bold;
        text-decoration: underline;
    }
    .feature .feature-text a:hover {
        color: #1e90ff;
        text-decoration: underline;
    }
    .closing p.bold {
        font-weight: bold;
    }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-title">STUDIO <span class="number">2</span> STADIUM</div>
    
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-image: url('https://d1wf5hycmlyms9.cloudfront.net/dcf07b79a52fb0c0964b14285be63a0143661a70d740dc08-c31b-4680-b7e4-264fc550dca2.jpg'); background-size: cover; background-position: top;" height="250">
            <tr>
                <td align="left" valign="bottom" style="padding: 10px;">
                    <img src="https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png" alt="Logo" width="80" style="display:block;"/>
                </td>
            </tr>
        </table>

        <h1 style="font-weight: normal;">Welcome to Studio <span style="font-weight:bold;">2</span> Stadium -</h1>
        <h1 style="font-weight: normal;">we’re <span style="font-weight:bold;">so</span> excited you’re here!</h1>

        <p>Whether you’re a dancer or a parent supporting this journey, our goal is to make you feel seen, supported, and empowered every step of the way. You’re now part of a growing community where dancers and college programs can finally connect—without all the confusion.</p>
        <p><strong>Here’s how we’ve got your back:</strong></p>

        <div class="feature">
            <img src="https://d1wf5hycmlyms9.cloudfront.net/strokeb856cf71-6500-4122-b3e7-dd37363f1c60.png" alt="Consulting" />
            <div class="feature-text">
                <b>Free 20-minute consulting call</b>
                Get your biggest questions answered, understand the college dance landscape, 
                and start narrowing down schools that feel like the right fit.
                <div>
                    <a href="https://calendly.com/studiotostadium/s2s-dancer-consulting-coaching-call?preview_source=et_card&month=2025-${new Date().getMonth() + 1}">
                        → Schedule Your Free Call
                    </a>
                </div>
            </div>

        </div>

        <div class="feature">
            <img src="https://d1wf5hycmlyms9.cloudfront.net/c4074ac47f2cc82061236c15c691dd762863903f19100796-e2da-41ab-8608-4a6cfa85c7b9.png" alt="Library" />
            <div class="feature-text">
                <b>Members-only video training library</b>
                Access training tools, audition tips, coach insights, and more—designed to help you grow and stay ready for every opportunity.
            </div>
        </div>

        <div class="feature">
            <img src="https://d1wf5hycmlyms9.cloudfront.net/tagbfed9d19-8eec-4ddd-b892-97b72d2fc20a.png" alt="Tagging" />
            <div class="feature-text"><b>Event tagging system</b>Use our event tagging system to stay top-of-mind. When you attend clinics, combines, and camps—tag them. Visibility creates momentum.
            </div>
        </div>

        <div class="steps">
            <div class="steps-title"><b>Maximize</b> Your Experience -</div>
            <div class="steps-title">Here’s What to Do Next:</div>
            <div class="step">
                <div class="step-number">1</div>
                <div class="step-text">
                    <b>Complete your profile.</b>
                    <div>This is your first impression. Coaches use your profile to start building their list of dancers to watch—so the more complete and current it is, the better.</div>
                </div>
            </div>
            <div class="step">
                <div class="step-number">2</div>
                <div class="step-text">
                    <b>Explore college programs.</b> 
                    <div>Each program on Studio 2 Stadium is different— we help you filter by what matters to you.</div>
                </div>
            </div>
            <div class="step">
                <div class="step-number">3</div>
                <div class="step-text">
                    <b>Keep your profile active.</b> 
                    <div>Update your videos, tag new events, and refresh your info often. Active profiles rise higher in coach home feed.</div>
                </div>
            </div>
            <div class="step">
                <div class="step-number">4</div>
                <div class="step-text">
                    <b>Notify programs when you submit your Common Recruiting Video.</b> 
                    <div>Once you’ve submitted it, let those programs know through the platform. This allows coaches to update your status (in review, released, or accepted), so you have more clarity on where you stand in the process.</div>
                </div>
            </div>
        </div>

        <div class="closing">
            <p>This journey can feel overwhelming but you don’t have to do it alone.</p></br>
            <p>We built Studio <b>2</b> Stadium to make things simpler, more transparent, and more connected.</p>
            <p class="bold">We’re here to guide you through it.</p></br>
            <p>With you all the way,</p></br>
            <p>Abbey & The Studio <b>2</b> Stadium Team</p>
        </div>
       
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px; font-size:14px; color:#555;">
            <tr>
                <td width="40%" align="center" style="padding:15px; border-right:1px solid #000;">
                    <img src="https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png" alt="Logo" width="120" style="display:block; margin:0 auto;"/>
                </td>
    
                <td width="59%" align="left" style="padding:15px;">
                <p style="margin:6px 0;"><img src="https://d1wf5hycmlyms9.cloudfront.net/internet-svgrepo-comdc030971-a2db-47ef-8f08-05139b6d9d36.png" width="16" style="vertical-align:middle; margin-right:6px;"/>studio2stadium.com</p>
                <p style="margin:6px 0;"><img src="https://d1wf5hycmlyms9.cloudfront.net/email-1-svgrepo-com58963abb-0d7a-42ed-8a5d-94b32cc0a961.png" width="16" style="vertical-align:middle; margin-right:6px;"/>info@studio2stadium.com</p>
                <p style="margin:6px 0;"><img src="https://d1wf5hycmlyms9.cloudfront.net/instagram-svgrepo-comf0d9724b-9028-4fc1-9d8c-448fa0299188.png" width="16" style="vertical-align:middle; margin-right:6px;"/>studio2stadium_</p>
                <p style="margin:6px 0;"><img src="https://d1wf5hycmlyms9.cloudfront.net/tiktok-svgrepo-com20fe26ac-4505-4ec0-8a6d-9cb2c71d60eb.png" width="16" style="vertical-align:middle; margin-right:6px;"/>studio2stadium</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>`;

export const StudentWelcomeMessageFreemium = `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Studio 2 Stadium</title>
  <style>
    body {
        font-family: Arial, sans-serif;
        background-color: #ffffff;
        color: #333333;
        margin: 0;
        padding: 0;
    }
    .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 5px 20px;
    }
    .header-title {
        text-align: center;
        font-size: 28px;
        margin: 20px 0;
        font-weight: 400; 
    }
    .header-title .number {
        font-weight: 700; 
    }
    h1 {
        text-align: center;
        font-size: 24px;
        margin: 12px 0;
    }
    p {
        font-size: 15px;
        line-height: 1.6;
        margin: 10px 20px;
        text-align: center;
    }
    .features {
        display: flex;
        justify-content: space-around;
        margin: 30px 0;
        text-align: center;
    }
    .feature {
        width: 30%;
        font-size: 14px;
    }
    .feature img {
        width: 36px;
        height: 36px;
        margin-bottom: 8px;
    }
    /* Upgrade */
    .upgrade-box {
        margin: 5px;
    }
    .upgrade-box h2 {
        font-size: 18px;
        text-align: center;
        margin-bottom: 12px;
        color: #000;
    }
    .upgrade-box ul {
        list-style: none;
        padding: 0;
        margin: 0;
        text-align: center;
        font-size: 14px;
    }
    .upgrade-box li {
        margin-bottom: 8px;
    }
    .upgrade-button {
        display: block;
        width: fit-content;
        margin: 15px auto;
        padding: 10px 70px;
        background-color: #c5a880;
        color: #fff; 
        text-decoration: none;
        font-weight: bold;
        border-radius: 15px;
    }
    .closing {
        text-align: center;
        font-size: 15px;
        padding: 20px;
    }
    .closing p.bold {
        font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-title">STUDIO <span class="number">2</span> STADIUM</div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-image: url('https://d1wf5hycmlyms9.cloudfront.net/f8eb0074f3bc11f6b9ec7056e4dafdf444e01584dabb9745-705f-47f9-a05d-5c182ece1f0b.png'); background-size: cover; background-position: top;" height="250">
        <tr>
            <td align="left" valign="bottom" style="padding: 10px;">
            <a href="https://studio2stadium.com/auth/signup/dancer" 
                style="background-color:#fff; color:#000; padding:10px 20px; border-radius:6px; font-weight:bold; font-size:14px; text-decoration:none; display:inline-block;">
                Unlock access. Be seen first.
            </a>
            </td>
            <td align="right" valign="bottom" style="padding: 10px;">
            <img src="https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png" alt="Logo" width="80" style="display:block;"/>
            </td>
        </tr>
    </table>

    <h1 style="font-weight: normal;">Welcome to Studio <span style="font-weight:bold;">2</span> Stadium -</h1>
    <h1 style="font-weight: normal;">we’re <span style="font-weight:bold;">so</span> excited you’re here!</h1>
    <p>By creating your free profile, you’ve taken your first step toward getting noticed by college coaches. You now have a space to tell your story, track your progress, and explore what’s possible.</p>
    <p><strong>Here’s what you can do right now:</strong></p>

    <div class="features">
      <div class="feature">
        <img src="https://d1wf5hycmlyms9.cloudfront.net/uploadec19450d-c273-4948-a6bc-f20f26af9b57.png" alt="Upload" />
        <p>Upload photos & build your digital resume</p>
      </div>
      <div class="feature">
        <img src="https://d1wf5hycmlyms9.cloudfront.net/e68a6ab6c4903b7ddaa7fa1e318e9fd3307b0adfbfc6dcb0-6f0d-4419-a27e-ba6b4d097bad.png" alt="Access" />
        <p>Access blogs, insights, & resources</p>
      </div>
      <div class="feature">
        <img src="https://d1wf5hycmlyms9.cloudfront.net/f428bb6d06bceee73dd0a8798458720611eb543f6485b641-ccf2-490b-b79c-586be08472d4.png" alt="Discover" />
        <p>Get discovered by college programs</p>
      </div>
    </div>

    <div class="upgrade-box">
    <h1 style="font-weight: normal;">Want to go further, <span style="font-weight:bold;">faster</span>?</h1>
      <h2>Upgrade to Premium ($25/month) to:</h2>
      <ul>
        <li>✓ Upload unlimited videos</li>
        <li>✓ See which schools are viewing your profile</li>
        <li>✓ Stay organized with calendar tools</li>
        <li>✓ Access our exclusive training library</li>
        <li>✓ Track communication with programs</li>
        <li>✓ Show up on coaches home page</li>
        <li><b>✓ NEW! Prospect Status System:</b></li>
        <li><b>When you submit your Common Recruiting Video, let programs know.</b></li>
        <li><b>Coaches can update your status—so you’ll know if your video is in review, released, or accepted.</b></li>
      </ul>
      <a href="https://studio2stadium.com/auth/signup/dancer" class="upgrade-button" style="background-color:#c5a880; color:#fff !important; text-decoration:none; font-weight:bold; border-radius:15px; display:block; width:fit-content; margin:15px auto; padding:10px 70px;">Upgrade to Premium</a>
    </div>

    <div class="closing">
        <p>The more active you are, the more doors you’ll open.</p>
        <p class="bold">We’re here to support you every step of the way.</p>
        <p>Abbey & The Studio <b>2</b> Stadium Team</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:30px; font-size:14px; color:#555;">
        <tr>
            <td width="40%" align="center" style="padding:15px; border-right:1px solid #000;">
            <img src="https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png" alt="Logo" width="120" style="display:block; margin:0 auto;"/>
            </td>

            <td width="59%" align="left" style="padding:15px;">
            <p style="margin:6px 0;"><img src="https://d1wf5hycmlyms9.cloudfront.net/internet-svgrepo-comdc030971-a2db-47ef-8f08-05139b6d9d36.png" width="16" style="vertical-align:middle; margin-right:6px;"/>studio2stadium.com</p>
            <p style="margin:6px 0;"><img src="https://d1wf5hycmlyms9.cloudfront.net/email-1-svgrepo-com58963abb-0d7a-42ed-8a5d-94b32cc0a961.png" width="16" style="vertical-align:middle; margin-right:6px;"/>info@studio2stadium.com</p>
            <p style="margin:6px 0;"><img src="https://d1wf5hycmlyms9.cloudfront.net/instagram-svgrepo-comf0d9724b-9028-4fc1-9d8c-448fa0299188.png" width="16" style="vertical-align:middle; margin-right:6px;"/>studio2stadium_</p>
            <p style="margin:6px 0;"><img src="https://d1wf5hycmlyms9.cloudfront.net/tiktok-svgrepo-com20fe26ac-4505-4ec0-8a6d-9cb2c71d60eb.png" width="16" style="vertical-align:middle; margin-right:6px;"/>studio2stadium</p>
            </td>
        </tr>
    </table>
  </div>
</body>
</html>
`;
