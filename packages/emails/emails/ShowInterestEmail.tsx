import React from "react";
import { ShowInterestEmail } from "../src/templates/ShowInterestEmail.js";

export default function Preview() {
  return (
    <ShowInterestEmail
      schoolName="University of Dance"
      dancerName="Emma Johnson"
      dancerProfileUrl="https://studio2stadium.com/dancers/emma-johnson"
      interestCount={3}
    />
  );
}
