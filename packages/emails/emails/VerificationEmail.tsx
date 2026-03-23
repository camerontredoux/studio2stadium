import React from "react";
import { VerificationEmail } from "../src/templates/VerificationEmail.js";

export default function Preview() {
  return (
    <VerificationEmail
      firstName="Jane"
      verifyUrl="https://studio2stadium.com/verify?userId=123"
    />
  );
}
