import { randomUUID } from "node:crypto";
import { db } from "#database/connection";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import env from "#start/env";
import { createDancer, login } from "#tests/helpers/premium";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";

/**
 * Opens a real SSE stream so Transmit registers the uid, then asks to
 * subscribe it to `channel`. `__transmit/subscribe` answers 400 both for an
 * unknown uid and for a failed channel authorization, so the stream has to be
 * open for a 400 to mean "not authorized".
 */
async function subscribe(client: ApiClient, token: string, channel: string) {
  const uid = randomUUID();
  const abort = new AbortController();
  const stream = await fetch(
    `http://${env.get("HOST")}:${env.get("PORT")}/__transmit/events?uid=${uid}`,
    { headers: { Authorization: `Bearer ${token}` }, signal: abort.signal }
  );
  try {
    return await client
      .post("/__transmit/subscribe")
      .bearerToken(token)
      .json({ uid, channel });
  } finally {
    abort.abort();
    await stream.body?.cancel().catch(() => {});
  }
}

async function fixture() {
  const [platformAdmin, organizer, dancer] = await Promise.all([
    createDancer(),
    createDancer(),
    createDancer(),
  ]);
  await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.id, platformAdmin.id));
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Live Org",
      slug: "live-org",
      features: { callbacks: true },
    })
    .returning();
  await db.insert(orgMemberships).values([
    { orgId: org!.id, userId: organizer.id, role: "admin", type: "organizer" },
    { orgId: org!.id, userId: dancer.id, role: "member", type: "dancer" },
  ]);
  return { platformAdmin, organizer, dancer, org: org! };
}

test.group("POST /__transmit/subscribe", (group) => {
  group.each.setup(async () => {
    await db.delete(organizations);
    await db.delete(users);
  });

  test("a platform admin with no membership subscribes to the callbacks board", async ({
    client,
  }) => {
    const { platformAdmin, org } = await fixture();
    const token = await login(client, platformAdmin.email);
    const res = await subscribe(client, token, `orgs/${org.slug}/callbacks`);
    res.assertStatus(204);
  });

  test("an organizer subscribes to callbacks and showcases", async ({
    client,
  }) => {
    const { organizer, org } = await fixture();
    const token = await login(client, organizer.email);
    const callbacks = await subscribe(
      client,
      token,
      `orgs/${org.slug}/callbacks`
    );
    callbacks.assertStatus(204);
    const showcases = await subscribe(
      client,
      token,
      `orgs/${org.slug}/showcases`
    );
    showcases.assertStatus(204);
  });

  test("a dancer subscribes to showcases but not to callbacks", async ({
    client,
  }) => {
    const { dancer, org } = await fixture();
    const token = await login(client, dancer.email);
    const showcases = await subscribe(
      client,
      token,
      `orgs/${org.slug}/showcases`
    );
    showcases.assertStatus(204);
    const callbacks = await subscribe(
      client,
      token,
      `orgs/${org.slug}/callbacks`
    );
    callbacks.assertStatus(400);
  });
});
