import { test } from "@japa/runner";
import { validator } from "./validator.ts";

test.group("Explore dancers validator: gradYear", () => {
  test("parses a four-digit year from the query string", async ({ assert }) => {
    const payload = await validator.validate({ gradYear: "2027" });
    assert.strictEqual(payload.gradYear, 2027);
  });

  test("treats an empty value (All years) as no filter", async ({ assert }) => {
    const payload = await validator.validate({ gradYear: "" });
    assert.isUndefined(payload.gradYear);
  });

  test("rejects a value that is not a year", async ({ assert }) => {
    for (const gradYear of ["abc", "27", "2027.5", "20270"]) {
      await assert.rejects(() => validator.validate({ gradYear }));
    }
  });
});
