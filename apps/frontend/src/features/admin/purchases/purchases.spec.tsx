import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PurchasesTable } from "./components/purchases-table";
import {
  describeTierChange,
  formatPurchaseAmount,
  matchesPurchaseSearch,
  purchaseStatus,
  type EventTierPurchase,
} from "./lib";

function makePurchase(
  overrides: Partial<EventTierPurchase> = {},
): EventTierPurchase {
  return {
    id: "p1",
    reference: "cs_test_1",
    eventTier: "regional",
    amountTotal: 49900,
    currency: "usd",
    paymentIntentId: "pi_1",
    deactivatedAt: null,
    deactivationReason: null,
    deactivationReference: null,
    createdAt: "2026-09-01T12:00:00.000Z",
    awaitingClaim: false,
    buyer: {
      id: "u1",
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Organizer",
    },
    event: {
      id: "e1",
      name: "Summit 2026",
      eventTier: "regional",
      isActive: true,
      startDate: "2026-06-13",
      endDate: "2026-06-14",
    },
    org: { id: "o1", name: "Summit Dance Co", slug: "summit" },
    lastEventTierChange: null,
    ...overrides,
  };
}

/** Server-renders the table inside a router, as `Link` needs one. */
async function renderTable(purchases: EventTierPurchase[]) {
  const rootRoute = createRootRoute({
    component: () => (
      <PurchasesTable purchases={purchases} onChangeTier={() => {}} />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();
  return renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("admin purchases list", () => {
  it("shows each purchase's buyer, Event Tier, Org Event and amount", async () => {
    const html = await renderTable([makePurchase()]);

    expect(html).toContain("Ada Organizer");
    expect(html).toContain("ada@example.com");
    expect(html).toContain("Summit 2026");
    expect(html).toContain("Summit Dance Co");
    expect(html).toContain("Regional");
    expect(html).toContain("$499.00");
    expect(html).toContain("Change tier");
  });

  it("shows the Event Tier the event is at now, and who changed it when", async () => {
    const html = await renderTable([
      makePurchase({
        event: { ...makePurchase().event, eventTier: "national" },
        lastEventTierChange: {
          from: "regional",
          to: "national",
          changedAt: "2026-09-20T12:00:00.000Z",
          changedBy: {
            id: "s1",
            email: "staff@example.com",
            firstName: "Sam",
            lastName: "Staff",
          },
        },
      }),
    ]);

    expect(html).toContain("Now <!-- -->National");
    expect(html).toContain("Regional → National by Sam Staff on Sep 20, 2026");
  });

  it("offers to resend the claim email only for a purchase awaiting its claim", async () => {
    expect(await renderTable([makePurchase()])).not.toContain(
      "Resend claim email",
    );

    const html = await renderTable([makePurchase({ awaitingClaim: true })]);
    expect(html).toContain("Awaiting claim");
    expect(html).toContain("Resend claim email");
  });

  it("says so when there are no purchases", async () => {
    expect(await renderTable([])).toContain("No purchases yet");
  });
});

describe("purchase helpers", () => {
  it("formats the amount charged from minor units", () => {
    expect(formatPurchaseAmount(49900, "usd")).toBe("$499.00");
    expect(formatPurchaseAmount(null, null)).toBe("—");
  });

  it("puts a refund or dispute ahead of the event's active flag", () => {
    expect(purchaseStatus(makePurchase()).label).toBe("Active");
    expect(
      purchaseStatus(
        makePurchase({
          deactivationReason: "refunded",
          event: { ...makePurchase().event, isActive: false },
        }),
      ).label,
    ).toBe("Refunded");
    expect(
      purchaseStatus(makePurchase({ deactivationReason: "disputed" })).label,
    ).toBe("Disputed");
  });

  it("shows a purchase awaiting its claim as such, behind a refund", () => {
    expect(purchaseStatus(makePurchase({ awaitingClaim: true }))).toEqual({
      label: "Awaiting claim",
      variant: "warning",
    });
    expect(
      purchaseStatus(
        makePurchase({ awaitingClaim: true, deactivationReason: "refunded" }),
      ).label,
    ).toBe("Refunded");
  });

  it("describes no tier change as nothing", () => {
    expect(describeTierChange(null)).toBeNull();
  });

  it("finds a purchase by buyer, email, Org or Org Event", () => {
    const purchase = makePurchase();
    expect(matchesPurchaseSearch(purchase, "ada org")).toBe(true);
    expect(matchesPurchaseSearch(purchase, "ADA@EXAMPLE")).toBe(true);
    expect(matchesPurchaseSearch(purchase, "dance co")).toBe(true);
    expect(matchesPurchaseSearch(purchase, "summit 2026")).toBe(true);
    expect(matchesPurchaseSearch(purchase, "nobody")).toBe(false);
    expect(matchesPurchaseSearch(purchase, "  ")).toBe(true);
  });
});
