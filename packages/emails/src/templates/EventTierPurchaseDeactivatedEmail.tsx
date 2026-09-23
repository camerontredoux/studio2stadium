import { Hr, Link, Text } from "@react-email/components";
import { Layout } from "../components/Layout.js";
import { colors, headingStyle, paragraphStyle } from "../components/styles.js";

export interface EventTierPurchaseDeactivatedEmailProps {
  reason: "refunded" | "disputed";
  orgName: string;
  orgAdminUrl: string;
  eventName: string;
  eventTier: string;
  /** Whether the Org Event was live when it was stood down. */
  wasActive: boolean;
  buyerName: string;
  buyerEmail: string;
  checkoutSessionId: string;
  paymentIntentId: string;
  /** The refunded charge or the dispute, as Stripe names it. */
  providerReference: string;
}

const reasonLabels: Record<
  EventTierPurchaseDeactivatedEmailProps["reason"],
  string
> = {
  refunded: "refunded",
  disputed: "disputed",
};

/**
 * Tells the Studio 2 Stadium team that a refund or dispute stood a paid Org
 * Event down (ADR 0005). Nothing else is undone automatically, so this is the
 * hand raised for a person to resolve it in Stripe and the admin dashboard.
 */
export function EventTierPurchaseDeactivatedEmail({
  reason,
  orgName,
  orgAdminUrl,
  eventName,
  eventTier,
  wasActive,
  buyerName,
  buyerEmail,
  checkoutSessionId,
  paymentIntentId,
  providerReference,
}: EventTierPurchaseDeactivatedEmailProps) {
  const label = reasonLabels[reason];

  return (
    <Layout preview={`${orgName}: ${eventName} was ${label} and deactivated`}>
      <Text style={headingStyle}>An Org Event purchase was {label}</Text>
      <Text style={paragraphStyle}>
        <strong>{eventName}</strong> ({eventTier}) for{" "}
        <strong>{orgName}</strong> has been deactivated.{" "}
        {wasActive
          ? "It was the Org's active event, so the Org now has none."
          : "It was not the Org's active event."}
      </Text>
      <Text style={paragraphStyle}>
        Its roster, notes, ratings, callbacks and any Dancer Account Tiers were
        left as they were. Resolve it with the customer in Stripe, then
        reactivate the event from the admin dashboard if appropriate.
      </Text>
      <Hr style={{ borderColor: colors.border, margin: "16px 0" }} />
      <Text style={paragraphStyle}>
        <strong>Buyer:</strong> {buyerName} ({buyerEmail})
      </Text>
      <Text style={paragraphStyle}>
        <strong>Stripe {reason === "disputed" ? "dispute" : "charge"}:</strong>{" "}
        {providerReference}
      </Text>
      <Text style={paragraphStyle}>
        <strong>Payment:</strong> {paymentIntentId}
      </Text>
      <Text style={paragraphStyle}>
        <strong>Checkout Session:</strong> {checkoutSessionId}
      </Text>
      <Text style={paragraphStyle}>
        <Link href={orgAdminUrl}>Open the Org's admin area</Link>
      </Text>
    </Layout>
  );
}

export default EventTierPurchaseDeactivatedEmail;
