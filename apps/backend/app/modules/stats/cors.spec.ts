import { allowsOrigin } from "#config/cors";
import { test } from "@japa/runner";

const marketing = "https://studio2stadium.com";

test.group("CORS for the marketing site", () => {
  test("allows the marketing site on the public stats endpoint", ({
    assert,
  }) => {
    assert.isTrue(allowsOrigin(marketing, "/stats/public"));
    assert.isTrue(
      allowsOrigin("https://www.studio2stadium.com", "/stats/public")
    );
  });

  test("keeps the marketing site off every other route", ({ assert }) => {
    assert.isFalse(allowsOrigin(marketing, "/auth/login"));
    assert.isFalse(allowsOrigin(marketing, "/stats/public/x"));
  });

  test("still allows the product everywhere and strangers nowhere", ({
    assert,
  }) => {
    assert.isTrue(
      allowsOrigin("https://app.studio2stadium.com", "/auth/login")
    );
    assert.isFalse(allowsOrigin("https://evil.example", "/stats/public"));
  });
});
