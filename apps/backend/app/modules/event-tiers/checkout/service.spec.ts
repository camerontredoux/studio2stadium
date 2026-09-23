import { test } from "@japa/runner";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { checkoutSessionParams, Service } from "./service.ts";

const validPayload = () => ({
  name: "Ada Organizer",
  email: "ada@summit.example",
  eventTier: "regional" as const,
  orgName: "The Summit",
  eventName: "Summit 2026",
  startDate: "2026-06-13",
  endDate: "2026-06-14",
});

test.group("Service (create-checkout)", () => {
  test("rejects an end date before the start date before touching Stripe", async ({
    assert,
  }) => {
    const svc = new Service();
    const payload = {
      ...validPayload(),
      startDate: "2026-06-14",
      endDate: "2026-06-13",
    };

    await assert.rejects(() => svc.execute(payload), E_BAD_REQUEST);
  });
});

test.group("checkoutSessionParams", () => {
  test("asks Stripe for a post-purchase invoice so the buyer gets a receipt", ({
    assert,
  }) => {
    const params = checkoutSessionParams(validPayload());

    assert.equal(params.mode, "payment");
    assert.isTrue(params.invoice_creation?.enabled);
    assert.equal(
      params.invoice_creation?.invoice_data?.description,
      "Regional Event Tier: Summit 2026 (The Summit), 2026-06-13 to 2026-06-14"
    );
  });

  test("prefills Checkout with the email the buyer typed, which gets the receipt", ({
    assert,
  }) => {
    const params = checkoutSessionParams(validPayload());

    assert.equal(params.customer_email, "ada@summit.example");
  });

  test("carries the buyer to provisioning as the form's name and email, not an account", ({
    assert,
  }) => {
    const params = checkoutSessionParams(validPayload());

    assert.deepEqual(params.metadata, validPayload());
    assert.notProperty(params, "client_reference_id");
  });
});
