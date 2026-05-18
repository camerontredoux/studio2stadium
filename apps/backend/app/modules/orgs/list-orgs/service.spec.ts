import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { seedOrganizations } from "#commands/backfill-organizations";

test.group("GET /orgs", (group) => {
  group.each.setup(async () => {
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("returns all organizations sorted by name", async ({ client, assert }) => {
    const response = await client.get("/orgs");
    response.assertStatus(200);
    const body = response.body() as {
      slug: string;
      name: string;
      logoUrl: string | null;
      primaryColor: string | null;
    }[];
    assert.isAbove(body.length, 0);
    const names = body.map((o) => o.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
    const summit = body.find((o) => o.slug === "summit");
    assert.exists(summit);
    assert.equal(summit!.name, "Sharpen Up - The Summit");
    assert.equal(summit!.primaryColor, "#1a1a2e");
  });

  test("is publicly accessible with no auth header", async ({ client }) => {
    const response = await client.get("/orgs");
    response.assertStatus(200);
  });
});
