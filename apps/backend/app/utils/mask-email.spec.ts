import { test } from "@japa/runner";
import { maskEmail } from "./mask-email.ts";

test.group("maskEmail", () => {
  test("keeps the first character of the mailbox and the domain", ({
    assert,
  }) => {
    assert.equal(maskEmail("grace.hopper@example.com"), "g***@example.com");
    assert.equal(maskEmail("a@example.com"), "a***@example.com");
    assert.equal(
      maskEmail("Ada+s2s@Corp.Example.com"),
      "A***@Corp.Example.com"
    );
  });

  test("never echoes something that is not an address", ({ assert }) => {
    for (const value of ["", "no-at-sign", "@example.com", "ada@"]) {
      assert.equal(maskEmail(value), "***");
    }
  });
});
