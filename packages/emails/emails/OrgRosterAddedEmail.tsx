import React from "react";
import { OrgRosterAddedEmail } from "../src/templates/OrgRosterAddedEmail.js";

export default function Preview() {
  return (
    <OrgRosterAddedEmail
      firstName="Sarah"
      orgName="Sharpen Up Summit"
      eventName="The Summit 2026"
      eventDateLabel="Jun 20 – Jun 22, 2026"
      venueName="Dallas Convention Center"
      type="dancer"
      dashboardUrl="https://app.studio2stadium.com/o/sharpen-up/login"
      brandColor="#c5a880"
      welcomeVideoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      logoUrl="https://d1wf5hycmlyms9.cloudfront.net/s2slogo777018b0-7579-48d1-b9b1-9f8f044ab2c0.png"
    />
  );
}
