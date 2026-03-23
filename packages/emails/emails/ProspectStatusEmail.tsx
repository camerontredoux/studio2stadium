import React from "react";
import { ProspectStatusEmail } from "../src/templates/ProspectStatusEmail.js";

export default function Preview() {
  return (
    <ProspectStatusEmail
      dancerName="Emma"
      schoolName="University of Dance"
      status="accepted"
      submissionsUrl="https://studio2stadium.com/recruiting"
    />
  );
}
