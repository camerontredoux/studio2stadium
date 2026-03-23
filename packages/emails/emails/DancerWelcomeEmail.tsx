import React from "react";
import { DancerWelcomeEmail } from "../src/templates/DancerWelcomeEmail.js";

export default function Preview() {
  return (
    <DancerWelcomeEmail
      firstName="Emma"
      profileUrl="https://app.studio2stadium.com/profile"
    />
  );
}
