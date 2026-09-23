import { db } from "#database/connection";
import {
  csvUploads,
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import type { CapabilityResolution } from "#shared/org/entitlement";
import type { EventTier } from "#shared/org/event-tiers";
import hash from "@adonisjs/core/services/hash";
import type { ApiClient } from "@japa/api-client";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";

const PASSWORD = "event-capabilities-admin-test-password";

async function wipe() {
  await db.delete(eventAuditLog).execute();
  await db.delete(csvUploads).execute();
  await db.delete(eventRosters).execute();
  await db.delete(orgEvents).execute();
  await db.delete(orgMemberships).execute();
  await db.delete(users).execute();
  await db.delete(organizations).execute();
}

async function makeUser(name: string, role: "admin" | "user") {
  const email = `${name}@example.com`;
  const [user] = await db
    .insert(users)
    .values({
      username: name,
      email,
      displayEmail: email,
      firstName: name,
      lastName: "Tester",
      password: await hash.make(PASSWORD),
      role,
      type: "dancer",
      verified: true,
    })
    .returning();
  return user!;
}

async function tokenFor(client: ApiClient, email: string) {
  const res = await client
    .post("/auth/login")
    .header("X-Client-Type", "mobile")
    .json({ email, password: PASSWORD });
  res.assertStatus(200);
  return (res.body() as { token: string }).token;
}

async function orgWithEvents(slug: string, eventTiers: EventTier[]) {
  const [org] = await db
    .insert(organizations)
    .values({ name: slug, slug, features: {} })
    .returning();
  const events = await db
    .insert(orgEvents)
    .values(
      eventTiers.map((eventTier, index) => ({
        orgId: org!.id,
        name: `${slug} ${index}`,
        startDate: `2026-0${index + 1}-01`,
        endDate: `2026-0${index + 1}-02`,
        isActive: index === 0,
        eventTier,
      }))
    )
    .returning();
  return { org: org!, events };
}

interface EventCapabilitiesRow {
  id: string;
  name: string;
  eventTier: EventTier;
  capabilities: CapabilityResolution[];
}

function capability(row: EventCapabilitiesRow, name: string) {
  return row.capabilities.find((c) => c.capability === name)!;
}

test.group("Admin Org Event capability overrides (#109)", (group) => {
  group.each.setup(async () => {
    await wipe();
  });

  test("staff see, per event, the Event Tier default and the exceptions", async ({
    client,
    assert,
  }) => {
    const staff = await makeUser("caps_staff_list", "admin");
    const { org, events } = await orgWithEvents("caps-list", [
      "regional",
      "regional",
    ]);
    await db
      .update(orgEvents)
      .set({ capabilityOverrides: { check_in: false, video_library: true } })
      .where(eq(orgEvents.id, events[0]!.id));

    const res = await client
      .get(`/admin/orgs/${org.id}/events`)
      .header("Authorization", `Bearer ${await tokenFor(client, staff.email)}`);
    res.assertStatus(200);
    const rows = res.body() as EventCapabilitiesRow[];
    assert.lengthOf(rows, 2);

    const overridden = rows.find((r) => r.id === events[0]!.id)!;
    assert.deepEqual(capability(overridden, "check_in"), {
      capability: "check_in",
      eventTierDefault: true,
      override: false,
      included: false,
    });
    assert.deepEqual(capability(overridden, "video_library"), {
      capability: "video_library",
      eventTierDefault: false,
      override: true,
      included: true,
    });
    assert.deepEqual(capability(overridden, "callbacks"), {
      capability: "callbacks",
      eventTierDefault: true,
      override: null,
      included: true,
    });

    // The sibling has no exceptions: everything is its Event Tier's default.
    const plain = rows.find((r) => r.id === events[1]!.id)!;
    for (const c of plain.capabilities) {
      assert.isNull(c.override, c.capability);
      assert.equal(c.included, c.eventTierDefault, c.capability);
    }
  });

  test("staff set one event's overrides without touching its sibling", async ({
    client,
    assert,
  }) => {
    const staff = await makeUser("caps_staff_set", "admin");
    const { org, events } = await orgWithEvents("caps-set", [
      "enterprise",
      "enterprise",
    ]);
    const [target, sibling] = events;
    await db
      .update(orgEvents)
      .set({ capabilityOverrides: { callbacks: false } })
      .where(eq(orgEvents.id, sibling!.id));

    const res = await client
      .patch(`/admin/orgs/${org.id}/events/${target!.id}/capabilities`)
      .header("Authorization", `Bearer ${await tokenFor(client, staff.email)}`)
      .json({ capabilityOverrides: { check_in: false } });
    res.assertStatus(200);
    const row = res.body() as EventCapabilitiesRow;
    assert.equal(capability(row, "check_in").included, false);
    assert.equal(capability(row, "check_in").override, false);

    const [storedTarget] = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.id, target!.id));
    const [storedSibling] = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.id, sibling!.id));
    assert.deepEqual(storedTarget!.capabilityOverrides, { check_in: false });
    assert.deepEqual(storedSibling!.capabilityOverrides, { callbacks: false });
  });

  test("the body replaces the overrides whole, so leaving one out clears it", async ({
    client,
    assert,
  }) => {
    const staff = await makeUser("caps_staff_clear", "admin");
    const { org, events } = await orgWithEvents("caps-clear", ["core"]);
    const token = await tokenFor(client, staff.email);

    await client
      .patch(`/admin/orgs/${org.id}/events/${events[0]!.id}/capabilities`)
      .header("Authorization", `Bearer ${token}`)
      .json({ capabilityOverrides: { callbacks: true, check_in: true } })
      .then((res) => res.assertStatus(200));

    const res = await client
      .patch(`/admin/orgs/${org.id}/events/${events[0]!.id}/capabilities`)
      .header("Authorization", `Bearer ${token}`)
      .json({ capabilityOverrides: { callbacks: true } });
    res.assertStatus(200);

    const [stored] = await db
      .select()
      .from(orgEvents)
      .where(eq(orgEvents.id, events[0]!.id));
    assert.deepEqual(stored!.capabilityOverrides, { callbacks: true });
    const row = res.body() as EventCapabilitiesRow;
    assert.equal(capability(row, "check_in").included, false);
  });

  test("a change is recorded in the event's audit log, naming who made it", async ({
    client,
    assert,
  }) => {
    const staff = await makeUser("caps_staff_audit", "admin");
    const { org, events } = await orgWithEvents("caps-audit", ["regional"]);
    await db
      .update(orgEvents)
      .set({ capabilityOverrides: { callbacks: false } })
      .where(eq(orgEvents.id, events[0]!.id));

    await client
      .patch(`/admin/orgs/${org.id}/events/${events[0]!.id}/capabilities`)
      .header("Authorization", `Bearer ${await tokenFor(client, staff.email)}`)
      .json({ capabilityOverrides: { video_library: true } })
      .then((res) => res.assertStatus(200));

    const rows = await db
      .select()
      .from(eventAuditLog)
      .where(eq(eventAuditLog.eventId, events[0]!.id));
    assert.lengthOf(rows, 1);
    assert.equal(rows[0]!.actorId, staff.id);
    assert.deepEqual(rows[0]!.metadata, {
      diff: {
        "callbacks override": { from: "off", to: "Event Tier" },
        "video_library override": { from: "Event Tier", to: "on" },
      },
    });
  });

  test("an event under another Org is not found", async ({ client }) => {
    const staff = await makeUser("caps_staff_scope", "admin");
    const { org } = await orgWithEvents("caps-scope-a", ["core"]);
    const { events: others } = await orgWithEvents("caps-scope-b", ["core"]);

    const res = await client
      .patch(`/admin/orgs/${org.id}/events/${others[0]!.id}/capabilities`)
      .header("Authorization", `Bearer ${await tokenFor(client, staff.email)}`)
      .json({ capabilityOverrides: { callbacks: true } });
    res.assertStatus(404);
  });

  test("a non-boolean override is refused", async ({ client }) => {
    const staff = await makeUser("caps_staff_invalid", "admin");
    const { org, events } = await orgWithEvents("caps-invalid", ["core"]);

    const res = await client
      .patch(`/admin/orgs/${org.id}/events/${events[0]!.id}/capabilities`)
      .header("Authorization", `Bearer ${await tokenFor(client, staff.email)}`)
      .json({ capabilityOverrides: { callbacks: "yes" } });
    res.assertStatus(422);
  });

  test("only Studio 2 Stadium staff may read or set overrides", async ({
    client,
  }) => {
    const organizer = await makeUser("caps_organizer", "user");
    const { org, events } = await orgWithEvents("caps-forbidden", ["core"]);
    const token = await tokenFor(client, organizer.email);

    const list = await client
      .get(`/admin/orgs/${org.id}/events`)
      .header("Authorization", `Bearer ${token}`);
    list.assertStatus(403);

    const set = await client
      .patch(`/admin/orgs/${org.id}/events/${events[0]!.id}/capabilities`)
      .header("Authorization", `Bearer ${token}`)
      .json({ capabilityOverrides: { callbacks: true } });
    set.assertStatus(403);
  });
});
