import React from "react";
import { SchoolWelcomeEmail } from "../src/templates/SchoolWelcomeEmail.js";

export default function Preview() {
  return (
    <SchoolWelcomeEmail
      firstName="Coach Sarah"
      schoolName="University of Dance"
      dashboardUrl="https://studio2stadium.com/dashboard"
    />
  );
}
