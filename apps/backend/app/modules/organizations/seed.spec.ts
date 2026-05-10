import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { eq } from "drizzle-orm";
import { seedOrganizations } from "#commands/backfill-organizations";

test.group("organization seed", (group) => {
  group.each.setup(async () => {
    await db.delete(organizations).execute();
  });

  test("creates core, prodigy, and summit orgs idempotently", async ({
    assert,
  }) => {
    await seedOrganizations();
    await seedOrganizations(); // idempotent second run

    const [core] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "core"));
    const [prodigy] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "prodigy"));
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));

    assert.exists(core);
    assert.equal(core!.name, "Studio 2 Stadium");
    assert.exists(prodigy);
    assert.equal(prodigy!.name, "Prodigy");
    assert.exists(summit);
    assert.equal(summit!.name, "Sharpen Up - The Summit");

    const features = summit!.features as Record<string, boolean>;
    assert.isTrue(features.callbacks);
    assert.isTrue(features.school_selections);
    assert.isFalse(features.video_coach_assignment);
  });

  test("exactly three rows exist after seed", async ({ assert }) => {
    await seedOrganizations();
    const rows = await db.select().from(organizations);
    assert.lengthOf(rows, 3);
  });
});
