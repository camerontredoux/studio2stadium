import React from "react";
import { SubscriptionEndedEmail } from "../src/templates/SubscriptionEndedEmail.js";

export default function Preview() {
  return <SubscriptionEndedEmail upgradeUrl="https://app.studio2stadium.com/checkout" firstName="Emma" />;
}
