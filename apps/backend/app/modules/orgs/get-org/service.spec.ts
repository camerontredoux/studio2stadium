import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { seedOrganizations } from "#commands/backfill-organizations";

test.group("GET /orgs/:slug", (group) => {
  group.each.setup(async () => {
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("returns summit org metadata including branding and features", async ({
    client,
    assert,
  }) => {
    const response = await client.get("/orgs/summit");
    response.assertStatus(200);
    const body = response.body();
    assert.equal(body.slug, "summit");
    assert.equal(body.name, "Sharpen Up - The Summit");
    assert.equal(body.primaryColor, "#1a1a2e");
    assert.equal(body.accentColor, "#e94560");
    assert.isObject(body.features);
    assert.isTrue(body.features.callbacks);
    assert.isObject(body.settings);
    assert.equal(body.settings.max_school_selections, 3);
  });

  test("returns 404 for unknown slug", async ({ client }) => {
    const response = await client.get("/orgs/does-not-exist");
    response.assertStatus(404);
  });

  test("is publicly accessible with no auth header", async ({
    client,
    assert,
  }) => {
    // No .loginAs() — bare request, must succeed.
    const response = await client.get("/orgs/core");
    response.assertStatus(200);
    assert.equal(response.body().slug, "core");
  });
});
