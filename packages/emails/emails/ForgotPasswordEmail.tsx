import React from "react";
import { ForgotPasswordEmail } from "../src/templates/ForgotPasswordEmail.js";

export default function Preview() {
  return (
    <ForgotPasswordEmail resetUrl="https://app.studio2stadium.com/reset?token=abc123&userId=123" />
  );
}
