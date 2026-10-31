import { test } from "@japa/runner";
import {
  disputeToDeactivation,
  refundToDeactivation,
} from "./payment-events.ts";

test.group("refundToDeactivation", () => {
  test("a fully refunded charge deactivates the purchase it paid for", ({
    assert,
  }) => {
    assert.deepEqual(
      refundToDeactivation({
        id: "ch_full",
        refunded: true,
        payment_intent: "pi_full",
      }),
      {
        paymentIntentId: "pi_full",
        reason: "refunded",
        providerReference: "ch_full",
      }
    );
  });

  test("an expanded PaymentIntent is read by its id", ({ assert }) => {
    const input = refundToDeactivation({
      id: "ch_expanded",
      refunded: true,
      payment_intent: { id: "pi_expanded" },
    });

    assert.equal(input?.paymentIntentId, "pi_expanded");
  });

  test("a partial refund is a concession, not the purchase taken back", ({
    assert,
  }) => {
    assert.isNull(
      refundToDeactivation({
        id: "ch_partial",
        refunded: false,
        payment_intent: "pi_partial",
      })
    );
  });

  test("a charge with no PaymentIntent cannot belong to a purchase", ({
    assert,
  }) => {
    assert.isNull(
      refundToDeactivation({
        id: "ch_legacy",
        refunded: true,
        payment_intent: null,
      })
    );
  });
});

test.group("disputeToDeactivation", () => {
  test("an opened dispute deactivates the purchase it contests", ({
    assert,
  }) => {
    assert.deepEqual(
      disputeToDeactivation({ id: "dp_opened", payment_intent: "pi_disputed" }),
      {
        paymentIntentId: "pi_disputed",
        reason: "disputed",
        providerReference: "dp_opened",
      }
    );
  });

  test("a dispute with no PaymentIntent cannot belong to a purchase", ({
    assert,
  }) => {
    assert.isNull(
      disputeToDeactivation({ id: "dp_legacy", payment_intent: null })
    );
  });
});
