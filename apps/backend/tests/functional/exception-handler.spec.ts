import HttpExceptionHandler from "#exceptions/handler";
import testUtils from "@adonisjs/core/services/test_utils";
import { test } from "@japa/runner";

test.group("HttpExceptionHandler", () => {
  test("an error it has no case for is a 500, not an empty 200", async ({
    assert,
  }) => {
    const ctx = await testUtils.createHttpContext();

    await new HttpExceptionHandler().handle(
      new Error("Invalid API Key provided"),
      ctx
    );

    assert.equal(ctx.response.getStatus(), 500);
    // The error's own message stays on the server.
    assert.deepEqual(ctx.response.getBody(), {
      message: "Something went wrong. Please try again.",
      code: "E_INTERNAL",
      status: 500,
    });
  });
});
