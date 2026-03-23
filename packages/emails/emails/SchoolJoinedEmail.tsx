import React from "react";
import { SchoolJoinedEmail } from "../src/templates/SchoolJoinedEmail.js";

export default function Preview() {
  return (
    <SchoolJoinedEmail
      dancerName="Emma"
      upgradeUrl="https://studio2stadium.com/settings/membership"
    />
  );
}
