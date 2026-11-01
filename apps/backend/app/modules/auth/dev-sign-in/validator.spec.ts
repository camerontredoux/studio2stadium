import { test } from "@japa/runner";
import { ValidationError } from "@vinejs/vine";
import { validator } from "./validator.ts";

const code = "a".repeat(64);

test.group("Validator (dev-sign-in)", () => {
  test("accepts a code without a redirect", async ({ assert }) => {
    const result = await validator.validate({ code });
    assert.isUndefined(result.redirect);
  });

  test("accepts a path on the frontend as the redirect", async ({ assert }) => {
    const result = await validator.validate({
      code,
      redirect: "/resources/favorites?tab=2#top",
    });
    assert.equal(result.redirect, "/resources/favorites?tab=2#top");
  });

  for (const redirect of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "evil.example",
    "/path with space",
    "/\tpath",
  ]) {
    test(`rejects a redirect that could leave the site: ${JSON.stringify(redirect)}`, async ({
      assert,
    }) => {
      const [error] = await validator.tryValidate({ code, redirect });
      assert.instanceOf(error, ValidationError);
    });
  }
});
