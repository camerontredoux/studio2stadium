import { test } from "@japa/runner";
import { checkoutDisclosure, describePrice } from "./disclosure.ts";

const month = (count: number) => ({ interval: "month", interval_count: count });

test.group("Checkout disclosure", () => {
  test("describes each plan's price and period", ({ assert }) => {
    assert.equal(
      describePrice({
        unit_amount: 2500,
        currency: "usd",
        recurring: month(1),
      }),
      "$25.00 per month"
    );
    assert.equal(
      describePrice({
        unit_amount: 6900,
        currency: "usd",
        recurring: month(3),
      }),
      "$69.00 every 3 months"
    );
    assert.equal(
      describePrice({
        unit_amount: 25000,
        currency: "usd",
        recurring: { interval: "year", interval_count: 1 },
      }),
      "$250.00 per year"
    );
    assert.equal(
      describePrice({ unit_amount: 1299, currency: "usd", recurring: null }),
      "$12.99"
    );
  });

  test("names the first charge date for credited Week Pass days", ({
    assert,
  }) => {
    const price = { unit_amount: 2500, currency: "usd", recurring: month(1) };
    assert.equal(
      checkoutDisclosure(price, new Date("2026-11-22T17:00:00Z")),
      "Your 1-Week Pass days are credited, so you pay nothing today. Your first charge is on November 22, 2026. Renews automatically at $25.00 per month until you cancel in Membership settings."
    );
  });
});
