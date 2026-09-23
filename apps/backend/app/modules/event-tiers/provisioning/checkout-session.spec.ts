import { test } from "@japa/runner";
import { toCheckoutMetadata } from "../checkout/metadata.ts";
import {
  toProvisionInput,
  UnprovisionableCheckoutError,
  type CompletedCheckoutSession,
} from "./checkout-session.ts";

const BUYER_ID = "8f14e45f-ceea-4c9e-b0f5-8a3f3a1e2a2b";

// Exactly what `checkout/service.ts` writes onto the session it creates.
const metadata = () =>
  toCheckoutMetadata({
    userId: BUYER_ID,
    eventTier: "regional",
    orgName: "The Summit",
    eventName: "Summit 2026",
    startDate: "2026-06-13",
    endDate: "2026-06-14",
  });

const session = (
  overrides: Partial<CompletedCheckoutSession> = {}
): CompletedCheckoutSession => ({
  id: "cs_test_summit",
  client_reference_id: BUYER_ID,
  payment_status: "paid",
  metadata: metadata(),
  payment_intent: "pi_test_summit",
  ...overrides,
});

test.group("toProvisionInput", () => {
  test("a paid session becomes the purchase the checkout form described", async ({
    assert,
  }) => {
    const input = await toProvisionInput(session());

    assert.deepEqual(input, {
      reference: "cs_test_summit",
      buyerUserId: BUYER_ID,
      purchase: metadata(),
      paymentIntentId: "pi_test_summit",
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

  test("the buyer is the user id the session references, not an email", async ({
    assert,
  }) => {
    const input = await toProvisionInput(
      session({
        metadata: { ...metadata(), email: "finance@corp.example" },
      })
    );

    assert.equal(input.buyerUserId, BUYER_ID);
  });

  test("a session with no buyer is surfaced, not dropped", async ({
    assert,
  }) => {
    await assert.rejects(
      () => toProvisionInput(session({ client_reference_id: null })),
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
