import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { signUnsubscribeToken } from "#shared/prospect-emails/unsubscribe-token";
import { eq } from "drizzle-orm";
import { UnsubscribeService } from "./service.ts";

let seq = 0;
async function makeUser() {
  seq += 1;
  const handle = `unsub-${Date.now()}-${seq}`;
  const [user] = await db
    .insert(users)
    .values({
      username: handle,
      email: `${handle}@example.com`,
      role: "user",
      type: "school",
      displayEmail: `${handle}@example.com`,
      firstName: "Test",
      lastName: "User",
      password: "x",
      notifications: true,
    })
    .returning();
  return user!;
}

test.group("UnsubscribeService", (group) => {
  group.each.setup(async () => {
    await db.delete(users).execute();
  });

  test("sets notifications to false for a valid token", async ({ assert }) => {
    const user = await makeUser();
    const service = new UnsubscribeService();

    const ok = await service.execute(signUnsubscribeToken(user.id));

    assert.isTrue(ok);
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    assert.isFalse(after!.notifications);
  });

  test("returns false for a forged token and changes nothing", async ({ assert }) => {
    const user = await makeUser();
    const service = new UnsubscribeService();

    const ok = await service.execute("forged");

    assert.isFalse(ok);
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    assert.isTrue(after!.notifications);
  });

  test("is idempotent", async ({ assert }) => {
    const user = await makeUser();
    const service = new UnsubscribeService();
    const token = signUnsubscribeToken(user.id);

    assert.isTrue(await service.execute(token));
    assert.isTrue(await service.execute(token));

    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    assert.isFalse(after!.notifications);
  });
});
