import { allowsOrigin } from "#config/cors";
import env from "#start/env";
import { test } from "@japa/runner";

const marketing = new URL(env.get("MARKETING_SITE_URL")).origin;

test.group("CORS for the marketing site", () => {
  test("allows the marketing site on the checkout and checkout-status endpoints", ({
    assert,
  }) => {
    assert.isTrue(allowsOrigin(marketing, "/event-tiers/checkout"));
    assert.isTrue(allowsOrigin(marketing, "/event-tiers/checkout/cs_test_abc"));
  });

  test("keeps the marketing site off every other route", ({ assert }) => {
    assert.isFalse(allowsOrigin(marketing, "/auth/login"));
    assert.isFalse(allowsOrigin(marketing, "/auth/session"));
    assert.isFalse(allowsOrigin(marketing, "/event-tiers/checkout/cs_1/x"));
  });

  test("still allows the product everywhere and strangers nowhere", ({
    assert,
  }) => {
    assert.isTrue(
      allowsOrigin("https://app.studio2stadium.com", "/auth/login")
    );
    assert.isFalse(
      allowsOrigin("https://evil.example", "/event-tiers/checkout")
    );
  });
});
