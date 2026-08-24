import { test } from "@japa/runner";
import { ValidationError } from "@vinejs/vine";
import { schema } from "./validator.ts";

const validPayload = () => ({
  userId: "8f14e45f-ceea-4c9e-b0f5-8a3f3a1e2a2b",
  eventTier: "regional",
  orgName: "The Summit",
  eventName: "Summit 2026",
  startDate: "2026-06-13",
  endDate: "2026-06-14",
});

test.group("Validator (create-checkout)", () => {
  test("accepts a well-formed payload", async ({ assert }) => {
    const result = await schema.validate(validPayload());
    assert.equal(result.eventTier, "regional");
  });

  test("rejects Enterprise — self-serve Checkout excludes it", async ({
    assert,
  }) => {
    const [error] = await schema.tryValidate({
      ...validPayload(),
      eventTier: "enterprise",
    });
    assert.instanceOf(error, ValidationError);
  });

  test("rejects a tier name that does not exist", async ({ assert }) => {
    const [error] = await schema.tryValidate({
      ...validPayload(),
      eventTier: "premium",
    });
    assert.instanceOf(error, ValidationError);
  });

  test("rejects a userId that is not a uuid", async ({ assert }) => {
    const [error] = await schema.tryValidate({
      ...validPayload(),
      userId: "not-a-uuid",
    });
    assert.instanceOf(error, ValidationError);
  });

  test("rejects a malformed start date", async ({ assert }) => {
    const [error] = await schema.tryValidate({
      ...validPayload(),
      startDate: "06/13/2026",
    });
    assert.instanceOf(error, ValidationError);
  });

  test("rejects a missing org name", async ({ assert }) => {
    const payload = validPayload();
    delete (payload as Partial<typeof payload>).orgName;
    const [error] = await schema.tryValidate(payload);
    assert.instanceOf(error, ValidationError);
  });
});
