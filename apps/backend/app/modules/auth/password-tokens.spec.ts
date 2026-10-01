import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import hash from "@adonisjs/core/services/hash";
import redis from "@adonisjs/redis/services/main";
import { test } from "@japa/runner";
import { eq, like } from "drizzle-orm";
import {
  mintPasswordToken,
  PASSWORD_TOKEN_PURPOSES,
  passwordTokenKey,
} from "./password-tokens.ts";
import { Service as ResetPasswordService } from "./reset-password/service.ts";

const reset = new ResetPasswordService(new DatabaseService());

async function makeUser(suffix: string) {
  const [user] = await db
    .insert(users)
    .values({
      username: `pwtoken${suffix}`,
      email: `pwtoken_${suffix}@example.com`,
      displayEmail: `pwtoken_${suffix}@example.com`,
      firstName: "Ada",
      lastName: "Organizer",
      password: await hash.make("an unguessable placeholder"),
      role: "user",
      type: "dancer",
    })
    .returning();

  return user!;
}

async function verifiedOf(userId: string) {
  const [row] = await db
    .select({ verified: users.verified })
    .from(users)
    .where(eq(users.id, userId));
  return row!.verified;
}

async function passwordOf(userId: string) {
  const [row] = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, userId));
  return row!.password;
}

test.group("Password tokens", (group) => {
  group.each.setup(async () => {
    await db.delete(users).where(like(users.username, "pwtoken%")).execute();
  });

  test("a set-password token lives for a week, apart from the 15-minute reset", async ({
    assert,
  }) => {
    const user = await makeUser("ttl");

    await mintPasswordToken("setup", user.id);
    await mintPasswordToken("reset", user.id);

    const setupTtl = await redis.ttl(passwordTokenKey("setup", user.id));
    const resetTtl = await redis.ttl(passwordTokenKey("reset", user.id));

    assert.isAbove(setupTtl, PASSWORD_TOKEN_PURPOSES.setup.ttlSeconds - 60);
    assert.isAtMost(resetTtl, 15 * 60);
    assert.notEqual(
      passwordTokenKey("setup", user.id),
      passwordTokenKey("reset", user.id)
    );
  });

  test("the reset-password endpoint sets a password from a set-password token, once", async ({
    assert,
  }) => {
    const user = await makeUser("setup");
    const token = await mintPasswordToken("setup", user.id);

    await reset.execute({ userId: user.id, token, password: "new-password-1" });

    assert.isTrue(
      await hash.verify(await passwordOf(user.id), "new-password-1")
    );
    assert.isNull(await redis.get(passwordTokenKey("setup", user.id)));

    await assert.rejects(
      () =>
        reset.execute({ userId: user.id, token, password: "new-password-2" }),
      E_BAD_REQUEST
    );
  });

  test("asking for a reset does not cancel a pending set-password link", async ({
    assert,
  }) => {
    const user = await makeUser("both");
    const setupToken = await mintPasswordToken("setup", user.id);
    await mintPasswordToken("reset", user.id);

    await reset.execute({
      userId: user.id,
      token: setupToken,
      password: "new-password-1",
    });

    assert.isTrue(
      await hash.verify(await passwordOf(user.id), "new-password-1")
    );
  });

  test("a forgot-password token still resets the password", async ({
    assert,
  }) => {
    const user = await makeUser("reset");
    const token = await mintPasswordToken("reset", user.id);

    await reset.execute({ userId: user.id, token, password: "new-password-1" });

    assert.isTrue(
      await hash.verify(await passwordOf(user.id), "new-password-1")
    );
  });

  test("a wrong token sets nothing", async ({ assert }) => {
    const user = await makeUser("wrong");
    await mintPasswordToken("setup", user.id);
    const before = await passwordOf(user.id);

    await assert.rejects(
      () =>
        reset.execute({
          userId: user.id,
          token: "f".repeat(64),
          password: "new-password-1",
        }),
      E_BAD_REQUEST
    );

    assert.equal(await passwordOf(user.id), before);
    assert.isNotNull(await redis.get(passwordTokenKey("setup", user.id)));
  });

  test("setting a password from a set-password link verifies the email", async ({
    assert,
  }) => {
    const user = await makeUser("verify");
    assert.isFalse(await verifiedOf(user.id));
    const token = await mintPasswordToken("setup", user.id);

    await reset.execute({ userId: user.id, token, password: "new-password-1" });

    assert.isTrue(await verifiedOf(user.id));
  });

  test("a forgot-password reset leaves verification as it was", async ({
    assert,
  }) => {
    const user = await makeUser("noverify");
    const token = await mintPasswordToken("reset", user.id);

    await reset.execute({ userId: user.id, token, password: "new-password-1" });

    assert.isFalse(await verifiedOf(user.id));
  });

  test("the same link submitted twice at once sets a password once", async ({
    assert,
  }) => {
    const user = await makeUser("race");
    const token = await mintPasswordToken("setup", user.id);

    const outcomes = await Promise.allSettled([
      reset.execute({ userId: user.id, token, password: "first-password" }),
      reset.execute({ userId: user.id, token, password: "second-password" }),
    ]);

    assert.sameMembers(
      outcomes.map((outcome) => outcome.status),
      ["fulfilled", "rejected"]
    );
  });

  test("a wrong token leaves a pending reset token in place too", async ({
    assert,
  }) => {
    const user = await makeUser("wrongreset");
    await mintPasswordToken("reset", user.id);

    await assert.rejects(
      () =>
        reset.execute({
          userId: user.id,
          token: "e".repeat(64),
          password: "new-password-1",
        }),
      E_BAD_REQUEST
    );

    assert.isNotNull(await redis.get(passwordTokenKey("reset", user.id)));
  });
});
