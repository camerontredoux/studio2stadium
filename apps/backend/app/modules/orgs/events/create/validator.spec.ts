import { test } from "@japa/runner";
import { ValidationError } from "@vinejs/vine";
import { schema } from "./validator.ts";

const payload = () => ({
  name: "The Summit 2026",
  startDate: "2026-10-22",
  endDate: "2026-10-24",
  startTime: "10:00",
  endTime: "16:00",
  timezone: "America/Chicago",
});

// The update validator builds its time, date and zone fields from the same
// helpers in `../event-schedule.ts`, so these cases cover both.
test.group("Validator (create org event)", () => {
  test("accepts daily hours and an IANA zone", async ({ assert }) => {
    const result = await schema.validate(payload());
    assert.equal(result.endTime, "16:00");
  });

  for (const [field, value] of [
    ["startTime", "25:99"],
    ["endTime", "9:00"],
    ["timezone", "Not/A_Zone"],
  ] as const) {
    test(`rejects ${field} ${value}`, async ({ assert }) => {
      const [error] = await schema.tryValidate({
        ...payload(),
        [field]: value,
      });
      assert.instanceOf(error, ValidationError);
    });
  }
});
