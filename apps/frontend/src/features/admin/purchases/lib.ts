import type { components } from "@/lib/api/types";
import { eventTierLabel } from "@/lib/event-tiers";

/** One Event Tier purchase as the admin list returns it. */
export type EventTierPurchase =
  components["schemas"]["AdminEventtierpurchasesResponse"][number];

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

/** An amount in the currency's minor unit, as money. "—" when unrecorded. */
export function formatPurchaseAmount(
  amountTotal: number | null,
  currency: string | null,
): string {
  if (amountTotal === null || !currency) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountTotal / 100);
}

export function formatPurchaseDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", DATE_FORMAT);
}

export function personName(person: {
  firstName: string;
  lastName: string;
}): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

/** Where the purchase stands: refunded/disputed wins over the event flag. */
export function purchaseStatus(purchase: EventTierPurchase): {
  label: string;
  variant: "success" | "secondary" | "error" | "warning";
} {
  if (purchase.deactivationReason === "refunded") {
    return { label: "Refunded", variant: "error" };
  }
  if (purchase.deactivationReason === "disputed") {
    return { label: "Disputed", variant: "warning" };
  }
  return purchase.event.isActive
    ? { label: "Active", variant: "success" }
    : { label: "Inactive", variant: "secondary" };
}

/**
 * Who last changed the event's Event Tier by hand, and when — e.g.
 * "Regional → National by Jane Doe on Sep 23, 2026". Null when never changed.
 */
export function describeTierChange(
  change: EventTierPurchase["lastEventTierChange"],
): string | null {
  if (!change) return null;
  const to = eventTierLabel(change.to);
  const moved = change.from ? `${eventTierLabel(change.from)} → ${to}` : to;
  return `${moved} by ${personName(change.changedBy)} on ${formatPurchaseDate(change.changedAt)}`;
}

/** Case-insensitive match on buyer, email, Org or Org Event. */
export function matchesPurchaseSearch(
  purchase: EventTierPurchase,
  search: string,
): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [
    personName(purchase.buyer),
    purchase.buyer.email,
    purchase.org.name,
    purchase.event.name,
  ].some((value) => value.toLowerCase().includes(needle));
}
