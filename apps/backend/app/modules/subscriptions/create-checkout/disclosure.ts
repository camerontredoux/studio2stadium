import { formatBillingDate } from "#utils/date";

/** The fields of a Stripe Price that the disclosure reads. */
export interface DisclosedPrice {
  unit_amount: number | null;
  currency: string;
  recurring: { interval: string; interval_count: number } | null;
}

/** "$69.00 every 3 months", "$25.00 per month", or "$12.99" for a one-time price. */
export function describePrice(price: DisclosedPrice): string {
  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency.toUpperCase(),
  }).format((price.unit_amount ?? 0) / 100);

  if (!price.recurring) return amount;

  const { interval, interval_count: count } = price.recurring;
  return count === 1
    ? `${amount} per ${interval}`
    : `${amount} every ${count} ${interval}s`;
}

/** How a subscription renews: "Renews automatically at $69.00 every 3 months until you cancel in Membership settings." */
export function renewalTerms(price: DisclosedPrice): string {
  return `Renews automatically at ${describePrice(price)} until you cancel in Membership settings.`;
}

/**
 * The line Stripe Checkout shows above its pay button. A subscription says
 * that it renews automatically, at what price and how often, and, for a Week
 * Pass holder upgrading, that the pass's unused days are credited and when
 * the first charge falls. Stripe's own summary calls the credited days a free
 * trial; this line says what they really are.
 */
export function checkoutDisclosure(
  price: DisclosedPrice,
  firstChargeAt: Date | null
): string {
  if (!price.recurring) {
    return "One-time payment for 7 days of access. It does not renew.";
  }

  const renewal = renewalTerms(price);

  if (!firstChargeAt) return renewal;

  return `Your 1-Week Pass days are credited, so you pay nothing today. Your first charge is on ${formatBillingDate(firstChargeAt)}. ${renewal}`;
}
