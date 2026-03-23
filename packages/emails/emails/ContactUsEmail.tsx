import React from "react";
import { ContactUsEmail } from "../src/templates/ContactUsEmail.js";

export default function Preview() {
  return (
    <ContactUsEmail
      name="John Smith"
      email="john@example.com"
      subject="Question about features"
      message="Hi, I have a question about the premium features. Thanks!"
    />
  );
}
