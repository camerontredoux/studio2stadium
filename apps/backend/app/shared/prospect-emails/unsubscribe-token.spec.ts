import { test } from "@japa/runner";
import encryption from "@adonisjs/core/services/encryption";
import {
  signUnsubscribeToken,
  unsubscribeUrl,
  verifyUnsubscribeToken,
} from "./unsubscribe-token.ts";

test.group("unsubscribe tokens", () => {
  test("round-trips a user id", async ({ assert }) => {
    const token = signUnsubscribeToken("user-123");
    assert.equal(verifyUnsubscribeToken(token), "user-123");
  });

  test("does not expose the raw user id", async ({ assert }) => {
    const token = signUnsubscribeToken("user-123");
    assert.notInclude(token, "user-123");
  });

  test("rejects a forged token", async ({ assert }) => {
    assert.isNull(verifyUnsubscribeToken("not-a-real-token"));
  });

  test("rejects a token encrypted for a different purpose", async ({ assert }) => {
    const wrongPurpose = encryption.encrypt("user-123", undefined, "some-other-purpose");
    assert.isNull(verifyUnsubscribeToken(wrongPurpose));
  });

  test("builds a url with the token in the query string", async ({ assert }) => {
    const url = unsubscribeUrl("https://api.example.com/", "user-123");
    assert.match(url, /^https:\/\/api\.example\.com\/unsubscribe\?token=/);
    assert.notInclude(url, "user-123");
  });
});
