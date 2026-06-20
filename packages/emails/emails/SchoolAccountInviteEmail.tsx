import React from "react";
import { SchoolAccountInviteEmail } from "../src/templates/SchoolAccountInviteEmail.js";

export default function Preview() {
  return (
    <SchoolAccountInviteEmail
      firstName="Coach Johnson"
      orgName="Sharpen Up Summit"
      eventName="The Summit 2026"
      eventDateLabel="Jun 20 – Jun 22, 2026"
      venueName="Dallas Convention Center"
      registerUrl="https://app.studio2stadium.com/o/sharpen-up/register-school?t=abc123"
      brandColor="#c5a880"
      logoUrl="https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png"
    />
  );
}
