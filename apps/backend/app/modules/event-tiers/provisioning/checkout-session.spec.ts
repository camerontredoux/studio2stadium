import { test } from "@japa/runner";
import { type CheckoutMetadata } from "../checkout/metadata.ts";
import {
  toProvisionInput,
  UnprovisionableCheckoutError,
  type CompletedCheckoutSession,
} from "./checkout-session.ts";

// Exactly what `checkout/service.ts` writes onto the session it creates.
const metadata = (): CheckoutMetadata & Record<string, string> => ({
  name: "Ada Organizer",
  email: "ada@summit.example",
  eventTier: "regional",
  orgName: "The Summit",
  eventName: "Summit 2026",
  startDate: "2026-06-13",
  endDate: "2026-06-14",
});

const purchase = () => {
  const { name, email, ...rest } = metadata();
  return rest;
};

const session = (
  overrides: Partial<CompletedCheckoutSession> = {}
): CompletedCheckoutSession => ({
  id: "cs_test_summit",
  payment_status: "paid",
  metadata: metadata(),
  payment_intent: "pi_test_summit",
  amount_total: 49900,
  currency: "usd",
  ...overrides,
});

test.group("toProvisionInput", () => {
  test("a paid session becomes the purchase the checkout form described", async ({
    assert,
  }) => {
    const input = await toProvisionInput(session());

    assert.deepEqual(input, {
      reference: "cs_test_summit",
      buyer: { name: "Ada Organizer", email: "ada@summit.example" },
      purchase: purchase(),
      paymentIntentId: "pi_test_summit",
      amountTotal: 49900,
      currency: "usd",
    });
  });

  test("the payment is recorded so a later refund or dispute can find the purchase", async ({
    assert,
  }) => {
    const expanded = await toProvisionInput(
      session({ payment_intent: { id: "pi_test_expanded" } })
    );
    const missing = await toProvisionInput(session({ payment_intent: null }));

    assert.equal(expanded.paymentIntentId, "pi_test_expanded");
    assert.isNull(missing.paymentIntentId);
  });

  test("the purchase reference is the session, so a redelivery is the same purchase", async ({
    assert,
  }) => {
    const first = await toProvisionInput(session());
    const redelivered = await toProvisionInput(session());

    assert.equal(first.reference, redelivered.reference);
  });

  test("the buyer is the email typed at checkout, never the billing email Stripe reports", async ({
    assert,
  }) => {
    // What Stripe hands back on a corporate card (PRD story 17) rides along
    // on the session object; only the metadata names the buyer.
    const input = await toProvisionInput({
      ...session(),
      customer_details: { email: "finance@corp.example" },
      customer_email: "finance@corp.example",
    } as CompletedCheckoutSession);

    assert.equal(input.buyer.email, "ada@summit.example");
  });

  test("a session with no buyer email is surfaced, not dropped", async ({
    assert,
  }) => {
    const { email, ...withoutEmail } = metadata();

    await assert.rejects(
      () => toProvisionInput(session({ metadata: withoutEmail })),
      UnprovisionableCheckoutError
    );
  });

  test("a session that has not been paid for is surfaced, not provisioned", async ({
    assert,
  }) => {
    await assert.rejects(
      () => toProvisionInput(session({ payment_status: "unpaid" })),
      UnprovisionableCheckoutError
    );
  });

  test("a session without purchase metadata is surfaced, not dropped", async ({
    assert,
  }) => {
    await assert.rejects(
      () => toProvisionInput(session({ metadata: null })),
      UnprovisionableCheckoutError
    );
  });

  test("a session whose metadata names Enterprise is surfaced — it is never self-serve", async ({
    assert,
  }) => {
    await assert.rejects(
      () =>
        toProvisionInput(
          session({ metadata: { ...metadata(), eventTier: "enterprise" } })
        ),
      UnprovisionableCheckoutError
    );
  });

  test("the error names the session so it can be found in Stripe", async ({
    assert,
  }) => {
    try {
      await toProvisionInput(session({ id: "cs_test_lost", metadata: {} }));
      assert.fail("expected the session to be rejected");
    } catch (error) {
      assert.instanceOf(error, UnprovisionableCheckoutError);
      assert.equal(
        (error as UnprovisionableCheckoutError).sessionId,
        "cs_test_lost"
      );
      assert.include((error as Error).message, "cs_test_lost");
    }
  });
});
