import React from "react";
import { FeedbackEmail } from "../src/templates/FeedbackEmail.js";

export default function Preview() {
  return (
    <FeedbackEmail
      type="feature"
      message="It would be great if we could filter dancers by style!"
      page="/dancers"
      userId="user-123"
      userEmail="coach@university.edu"
      userName="Coach Sarah"
    />
  );
}
