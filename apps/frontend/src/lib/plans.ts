import type { components } from "@/lib/api/types";

/** The Dancer's plan, as GET /subscriptions reports it. */
export type Plan = components["schemas"]["Plan"];

/** The plans a Dancer can buy at /checkout. */
export type PaidPlan = Exclude<Plan, "free" | "premium">;

export interface PlanOffer {
  id: PaidPlan;
  name: string;
  /** Small caps line above the name, as on the pricing page. */
  eyebrow: string;
  price: string;
  per: string;
  /** The pricing page's sub-line under the price. */
  note: string;
  /** Checkout button label. */
  cta: string;
  /**
   * What the Dancer is charged and how often, shown before they pay and on
   * the membership page. The backend puts the same terms on Stripe Checkout
   * (`create-checkout/disclosure.ts`).
   */
  billing: string;
  badge?: string;
}

// Names, prices and sub-lines match the marketing site's pricing page.
// Stripe holds the real prices; keep these in step with it.
export const PREMIUM_OFFERS: PlanOffer[] = [
  {
    id: "monthly",
    name: "Monthly",
    eyebrow: "Flexible commitment",
    price: "$25",
    per: "/month",
    note: "Full access, billed monthly.",
    cta: "Go Premium",
    billing: "$25 every month. Automatically renews until you cancel.",
  },
  {
    id: "season_pass",
    name: "3-Month Season Pass",
    eyebrow: "A focused recruiting window",
    price: "$69",
    per: "/3 months",
    note: "Equivalent to $23/month. Automatically renews.",
    cta: "Get Season Pass",
    billing: "$69 every 3 months. Automatically renews until you cancel.",
  },
  {
    id: "annual",
    name: "Annual",
    eyebrow: "Best value",
    price: "$250",
    per: "/year",
    note: "Equivalent to $20.83/month. Billed annually.",
    cta: "Go Annual",
    billing: "$250 every year. Automatically renews until you cancel.",
    badge: "Save $50",
  },
];

export const WEEK_PASS_OFFER: PlanOffer = {
  id: "week_pass",
  name: "1-Week Pass",
  eyebrow: "A shorter commitment",
  price: "$12.99",
  per: "/pass",
  note: "One-time purchase. No automatic renewal.",
  cta: "Get a Week Pass",
  billing: "$12.99 once for 7 days. No automatic renewal.",
};

export const PREMIUM_FEATURES = [
  "Unlimited photos and videos",
  "Unlimited program follows",
  "Show Interest in a program up to 3 times",
  "Program finder and matching",
  "Common Recruit submissions for eligible seniors",
  "Training videos, recruiting resources, and the event calendar",
  "Road Map, Recruitment Tracker, and real-time notifications",
];

export const WEEK_PASS_FEATURES = [
  "Seven days of recruiting access",
  "Follow or favorite up to 5 programs",
  "Digital résumé with up to 4 photos and 3 videos",
  "Program finder, resources, Road Map, and Recruitment Tracker",
];

export const WEEK_PASS_EXCLUDED = [
  "Show Interest not included",
  "Common Recruit submissions not included",
];

export const PAID_OFFERS = [...PREMIUM_OFFERS, WEEK_PASS_OFFER];

export const PLAN_NAMES: Record<Plan, string> = {
  free: "Free Profile",
  week_pass: "1-Week Pass",
  monthly: "Monthly",
  season_pass: "3-Month Season Pass",
  annual: "Annual",
  // Premium from an Org Event grant, or a subscription on a retired price.
  premium: "Premium",
};
