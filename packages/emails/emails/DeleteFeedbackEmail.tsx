import React from "react";
import { DeleteFeedbackEmail } from "../src/templates/DeleteFeedbackEmail.js";

export default function Preview() {
  return (
    <DeleteFeedbackEmail
      userId="user-123"
      userEmail="emma@example.com"
      userName="Emma Johnson"
      feedback="I found a better platform for my needs."
    />
  );
}
