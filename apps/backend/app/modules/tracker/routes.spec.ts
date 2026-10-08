import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { test } from "@japa/runner";
import { sql } from "drizzle-orm";
import { createDancer, login, subscribe } from "#tests/helpers/premium";

interface Item {
  id: string;
  type: string;
  title: string;
  school: string | null;
  date: string | null;
  notes: string | null;
  stage: number;
}

test.group("Tracker routes", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
  });

  async function premiumDancer(client: Parameters<typeof login>[0]) {
    const dancer = await createDancer();
    await subscribe(dancer.id);
    return { dancer, token: await login(client, dancer.email) };
  }

  test("requires Premium", async ({ client }) => {
    const dancer = await createDancer();
    const token = await login(client, dancer.email);

    const response = await client.get("/tracker").bearerToken(token);
    response.assertStatus(403);
  });

  test("creates, lists newest first, updates, and deletes items", async ({
    client,
    assert,
  }) => {
    const { token } = await premiumDancer(client);

    const school = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "school", school: "Juilliard", stage: 1 });
    school.assertStatus(201);
    assert.equal((school.body() as Item).title, "Juilliard");

    const audition = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({
        type: "audition",
        title: "Spring audition",
        school: "Juilliard",
        date: "2027-02-14",
        notes: "Bring headshot",
      });
    audition.assertStatus(201);
    const auditionId = (audition.body() as Item).id;

    const list = await client.get("/tracker").bearerToken(token);
    list.assertStatus(200);
    const { items, sectionOrder } = list.body() as {
      items: Item[];
      sectionOrder: (string | null)[];
    };
    assert.deepEqual(
      items.map((item) => item.type),
      ["audition", "school"]
    );
    assert.equal(items[0].date, "2027-02-14");
    assert.deepEqual(sectionOrder, []);

    const updated = await client
      .patch(`/tracker/items/${auditionId}`)
      .bearerToken(token)
      .json({ stage: 2, date: null, notes: "" });
    updated.assertStatus(200);
    assert.containSubset(updated.body(), {
      stage: 2,
      date: null,
      notes: null,
      title: "Spring audition",
    });

    const deleted = await client
      .delete(`/tracker/items/${auditionId}`)
      .bearerToken(token);
    deleted.assertStatus(204);
    const after = await client.get("/tracker").bearerToken(token);
    assert.lengthOf((after.body() as { items: Item[] }).items, 1);
  });

  test("rejects a stage outside the item type's stages", async ({ client }) => {
    const { token } = await premiumDancer(client);

    const tooHigh = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "deadline", title: "FAFSA", stage: 2 });
    tooHigh.assertStatus(422);

    const negative = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "school", school: "Juilliard", stage: -1 });
    negative.assertStatus(422);

    const created = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "school", school: "Juilliard", stage: 5 });
    created.assertStatus(201);

    const update = await client
      .patch(`/tracker/items/${(created.body() as Item).id}`)
      .bearerToken(token)
      .json({ stage: 6 });
    update.assertStatus(422);
  });

  test("a school can only be tracked once", async ({ client }) => {
    const { token } = await premiumDancer(client);
    const add = () =>
      client
        .post("/tracker/items")
        .bearerToken(token)
        .json({ type: "school", school: "Juilliard" });

    const first = await add();
    first.assertStatus(201);
    const second = await add();
    second.assertStatus(409);
  });

  test("another dancer's items can't be read, changed, or deleted", async ({
    client,
    assert,
  }) => {
    const owner = await premiumDancer(client);
    const other = await premiumDancer(client);

    const created = await client
      .post("/tracker/items")
      .bearerToken(owner.token)
      .json({ type: "clinic", title: "Summer intensive" });
    const id = (created.body() as Item).id;

    const list = await client.get("/tracker").bearerToken(other.token);
    assert.lengthOf((list.body() as { items: Item[] }).items, 0);

    const update = await client
      .patch(`/tracker/items/${id}`)
      .bearerToken(other.token)
      .json({ title: "Hijacked" });
    update.assertStatus(404);

    const remove = await client
      .delete(`/tracker/items/${id}`)
      .bearerToken(other.token);
    remove.assertStatus(404);

    const ownerList = await client.get("/tracker").bearerToken(owner.token);
    assert.equal(
      (ownerList.body() as { items: Item[] }).items[0].title,
      "Summer intensive"
    );
  });

  test("saves the section order and removes a school's section", async ({
    client,
    assert,
  }) => {
    const { token } = await premiumDancer(client);
    for (const payload of [
      { type: "school", school: "Juilliard" },
      { type: "audition", title: "Audition", school: "Juilliard" },
      { type: "deadline", title: "FAFSA" },
    ]) {
      const response = await client
        .post("/tracker/items")
        .bearerToken(token)
        .json(payload);
      response.assertStatus(201);
    }

    const order = await client
      .put("/tracker/sections/order")
      .bearerToken(token)
      .json({ sections: [null, "Juilliard"] });
    order.assertStatus(204);

    const removed = await client
      .delete("/tracker/sections")
      .bearerToken(token)
      .json({ school: "Juilliard" });
    removed.assertStatus(204);

    const list = await client.get("/tracker").bearerToken(token);
    const body = list.body() as {
      items: Item[];
      sectionOrder: (string | null)[];
    };
    assert.deepEqual(body.sectionOrder, [null, "Juilliard"]);
    assert.deepEqual(
      body.items.map((item) => item.title),
      ["FAFSA"]
    );
  });
});
