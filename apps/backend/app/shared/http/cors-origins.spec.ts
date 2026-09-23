import { parseOrigins } from "#shared/http/cors-origins";
import { test } from "@japa/runner";

test.group("parseOrigins (CORS_ORIGINS)", () => {
  test("returns no origins when unset or blank", ({ assert }) => {
    assert.deepEqual(parseOrigins(undefined), []);
    assert.deepEqual(parseOrigins(""), []);
    assert.deepEqual(parseOrigins(" , "), []);
  });

  test("splits, trims and normalizes each entry to its origin", ({
    assert,
  }) => {
    assert.deepEqual(
      parseOrigins(
        " https://app-staging.studio2stadium.com/ ,https://staging.studio2stadium.com"
      ),
      [
        "https://app-staging.studio2stadium.com",
        "https://staging.studio2stadium.com",
      ]
    );
    assert.deepEqual(parseOrigins("http://localhost:5173/some/path"), [
      "http://localhost:5173",
    ]);
  });

  test("throws on an entry that is not a URL", ({ assert }) => {
    assert.throws(() => parseOrigins("app-staging.studio2stadium.com"));
  });
});
