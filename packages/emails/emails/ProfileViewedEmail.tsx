import React from "react";
import { ProfileViewedEmail } from "../src/templates/ProfileViewedEmail.js";

export default function Preview() {
  return (
    <ProfileViewedEmail
      dancerName="Emma"
      schoolName="University of Dance"
      schoolProfileUrl="https://studio2stadium.com/schools/university-of-dance"
      schoolLogoUrl="https://studio2stadium.com/img/premium-welcome-2x.jpg"
      freemium
      upgradeUrl="https://studio2stadium.com/settings/membership"
    />
  );
}

