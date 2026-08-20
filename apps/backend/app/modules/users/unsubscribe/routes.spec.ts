import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { signUnsubscribeToken } from "#shared/prospect-emails/unsubscribe-token";
import { eq } from "drizzle-orm";

let seq = 0;
async function makeUser() {
  seq += 1;
  const handle = `unsub-route-${Date.now()}-${seq}`;
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

test.group("unsubscribe routes", (group) => {
  group.each.setup(async () => {
    await db.delete(users).execute();
  });

  test("GET /unsubscribe with no token returns 400", async ({ client }) => {
    const response = await client.get("/unsubscribe");
    response.assertStatus(400);
  });

  test("POST /unsubscribe with no token returns 400", async ({ client }) => {
    const response = await client.post("/unsubscribe");
    response.assertStatus(400);
  });

  // Regression test for mail security scanners (Outlook SafeLinks, Proofpoint)
  // and prefetchers, which GET link targets with no human intent. GET must
  // never mutate — only the POST a human's form submit or a mailbox
  // provider's RFC 8058 one-click sends may flip `notifications`.
  test("GET /unsubscribe with a valid token confirms without mutating", async ({
    client,
    assert,
  }) => {
    const user = await makeUser();
    const token = signUnsubscribeToken(user.id);

    const response = await client.get("/unsubscribe").qs({ token });

    response.assertStatus(200);
    // force-json-response (start/kernel.ts) rewrites the request's Accept
    // header to application/json on every request. Confirms it does not
    // also mangle this route's explicit HTML response into JSON.
    assert.include(response.header("content-type"), "text/html");
    assert.include(response.text(), "<form");
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    assert.isTrue(after!.notifications);
  });

  test("POST /unsubscribe with a valid token unsubscribes", async ({
    client,
    assert,
  }) => {
    const user = await makeUser();
    const token = signUnsubscribeToken(user.id);

    const response = await client.post("/unsubscribe").qs({ token });

    response.assertStatus(200);
    const [after] = await db.select().from(users).where(eq(users.id, user.id));
    assert.isFalse(after!.notifications);
  });
});
