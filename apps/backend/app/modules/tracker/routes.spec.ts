import { db } from "#database/connection";
import { danceEvents } from "#database/schema/events";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import {
  createDancer,
  createSchool,
  login,
  subscribe,
} from "#tests/helpers/premium";

interface Item {
  id: string;
  type: string;
  title: string;
  school: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  } | null;
  event: { id: string; title: string; startDatetime: string } | null;
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

  /** A school-hosted event starting `days` from now. */
  async function createEvent(schoolId: string, days: number) {
    const start = new Date(Date.now() + days * 86_400_000);
    const [event] = await db
      .insert(danceEvents)
      .values({
        schoolId,
        title: `Event in ${days} days`,
        description: "Clinic",
        location: "CA",
        type: "workshop",
        startDatetime: start,
        endDatetime: new Date(start.getTime() + 3_600_000),
      })
      .returning();
    return event!;
  }

  async function unverifiedSchool() {
    const school = await createSchool();
    await db
      .update(users)
      .set({ verified: false })
      .where(eq(users.id, school.userId));
    return school;
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
    const juilliard = await createSchool();

    const school = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "school", schoolId: juilliard.id, stage: 1 });
    school.assertStatus(201);
    assert.containSubset(school.body(), {
      title: juilliard.name,
      school: { id: juilliard.id, name: juilliard.name },
    });

    const audition = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({
        type: "audition",
        title: "Spring audition",
        schoolId: juilliard.id,
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
    const { id: schoolId } = await createSchool();

    const tooHigh = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "deadline", title: "FAFSA", stage: 2 });
    tooHigh.assertStatus(422);

    const negative = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "school", schoolId, stage: -1 });
    negative.assertStatus(422);

    const created = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "school", schoolId, stage: 5 });
    created.assertStatus(201);

    const update = await client
      .patch(`/tracker/items/${(created.body() as Item).id}`)
      .bearerToken(token)
      .json({ stage: 6 });
    update.assertStatus(422);
  });

  test("a school can only be tracked once", async ({ client }) => {
    const { token } = await premiumDancer(client);
    const { id: schoolId } = await createSchool();
    const add = () =>
      client
        .post("/tracker/items")
        .bearerToken(token)
        .json({ type: "school", schoolId });

    const first = await add();
    first.assertStatus(201);
    const second = await add();
    second.assertStatus(409);
  });

  test("a dancer commits to one school at most", async ({ client }) => {
    const { token } = await premiumDancer(client);
    const { id: first } = await createSchool();
    const { id: second } = await createSchool();
    const { id: third } = await createSchool();
    const add = (schoolId: string, stage: number) =>
      client
        .post("/tracker/items")
        .bearerToken(token)
        .json({ type: "school", schoolId, stage });

    const committed = await add(first, 5);
    committed.assertStatus(201);
    const offer = await add(second, 4);
    offer.assertStatus(201);

    const created = await add(third, 5);
    created.assertStatus(409);
    created.assertBodyContains({ code: "E_ALREADY_COMMITTED" });

    const offerId = (offer.body() as Item).id;
    const updated = await client
      .patch(`/tracker/items/${offerId}`)
      .bearerToken(token)
      .json({ stage: 5 });
    updated.assertStatus(409);
    updated.assertBodyContains({ code: "E_ALREADY_COMMITTED" });

    // The committed school can still be saved, and stepping it back frees
    // the dancer to commit elsewhere.
    const committedId = (committed.body() as Item).id;
    const resaved = await client
      .patch(`/tracker/items/${committedId}`)
      .bearerToken(token)
      .json({ stage: 5, notes: "Signed" });
    resaved.assertStatus(200);
    await client
      .patch(`/tracker/items/${committedId}`)
      .bearerToken(token)
      .json({ stage: 4 })
      .then((response) => response.assertStatus(200));
    const switched = await client
      .patch(`/tracker/items/${offerId}`)
      .bearerToken(token)
      .json({ stage: 5 });
    switched.assertStatus(200);
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
    const { id: schoolId } = await createSchool();
    for (const payload of [
      { type: "school", schoolId },
      { type: "audition", title: "Audition", schoolId },
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
      .json({ sections: [null, schoolId] });
    order.assertStatus(204);

    const removed = await client
      .delete("/tracker/sections")
      .bearerToken(token)
      .json({ schoolId });
    removed.assertStatus(204);

    const list = await client.get("/tracker").bearerToken(token);
    const body = list.body() as {
      items: Item[];
      sectionOrder: (string | null)[];
    };
    assert.deepEqual(body.sectionOrder, [null, schoolId]);
    assert.deepEqual(
      body.items.map((item) => item.title),
      ["FAFSA"]
    );
  });

  test("rejects a schoolId that isn't in the schools directory", async ({
    client,
  }) => {
    const { token } = await premiumDancer(client);
    const unknown = "00000000-0000-4000-8000-000000000000";

    const create = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "audition", title: "Audition", schoolId: unknown });
    create.assertStatus(422);

    const created = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "clinic", title: "Clinic" });
    const update = await client
      .patch(`/tracker/items/${(created.body() as Item).id}`)
      .bearerToken(token)
      .json({ schoolId: unknown });
    update.assertStatus(422);
  });

  test("deleting a school keeps the dancer's other items under it", async ({
    client,
    assert,
  }) => {
    const { token } = await premiumDancer(client);
    const school = await createSchool();
    for (const payload of [
      { type: "school", schoolId: school.id },
      { type: "audition", title: "Audition", schoolId: school.id },
    ]) {
      const response = await client
        .post("/tracker/items")
        .bearerToken(token)
        .json(payload);
      response.assertStatus(201);
    }

    await db.delete(schoolProfiles).where(eq(schoolProfiles.id, school.id));

    const list = await client.get("/tracker").bearerToken(token);
    assert.containSubset((list.body() as { items: Item[] }).items, [
      { type: "audition", title: "Audition", school: null },
    ]);
    assert.lengthOf((list.body() as { items: Item[] }).items, 1);
  });

  test("lists upcoming events from verified schools, or one school's", async ({
    client,
    assert,
  }) => {
    const { token } = await premiumDancer(client);
    const host = await createSchool();
    const other = await createSchool();
    const hidden = await unverifiedSchool();
    const soon = await createEvent(host.id, 2);
    const later = await createEvent(host.id, 30);
    const otherEvent = await createEvent(other.id, 10);
    await createEvent(host.id, -2);
    await createEvent(hidden.id, 5);

    const all = await client.get("/tracker/events").bearerToken(token);
    all.assertStatus(200);
    const events = all.body() as {
      id: string;
      school: { id: string; name: string };
    }[];
    assert.deepEqual(
      events.map((event) => event.id),
      [soon.id, otherEvent.id, later.id]
    );
    assert.deepEqual(events[1].school, { id: other.id, name: other.name });

    const hosted = await client
      .get("/tracker/events")
      .qs({ schoolId: host.id })
      .bearerToken(token);
    assert.deepEqual(
      (hosted.body() as { id: string }[]).map((event) => event.id),
      [soon.id, later.id]
    );

    const none = await client
      .get("/tracker/events")
      .qs({ schoolId: hidden.id })
      .bearerToken(token);
    assert.deepEqual(none.body(), []);
  });

  test("a clinic item links an event, and works without one", async ({
    client,
    assert,
  }) => {
    const { token } = await premiumDancer(client);
    const host = await createSchool();
    const event = await createEvent(host.id, 7);

    const plain = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({ type: "clinic", title: "Open clinic" });
    plain.assertStatus(201);
    assert.isNull((plain.body() as Item).event);

    const linked = await client.post("/tracker/items").bearerToken(token).json({
      type: "clinic",
      title: "Fall clinic",
      schoolId: host.id,
      eventId: event.id,
    });
    linked.assertStatus(201);
    const id = (linked.body() as Item).id;
    assert.containSubset(linked.body(), {
      event: { id: event.id, title: event.title },
    });

    const list = await client.get("/tracker").bearerToken(token);
    assert.containSubset((list.body() as { items: Item[] }).items, [
      { id, event: { id: event.id } },
    ]);

    const cleared = await client
      .patch(`/tracker/items/${id}`)
      .bearerToken(token)
      .json({ eventId: null });
    cleared.assertStatus(200);
    assert.isNull((cleared.body() as Item).event);

    const relinked = await client
      .patch(`/tracker/items/${id}`)
      .bearerToken(token)
      .json({ eventId: event.id });
    relinked.assertStatus(200);
    assert.equal((relinked.body() as Item).event?.id, event.id);

    // Deleting the event keeps the item.
    await db.delete(danceEvents).where(eq(danceEvents.id, event.id));
    const after = await client.get("/tracker").bearerToken(token);
    assert.containSubset((after.body() as { items: Item[] }).items, [
      { id, title: "Fall clinic", event: null },
    ]);
  });

  test("rejects an event the item can't link", async ({ client }) => {
    const { token } = await premiumDancer(client);
    const host = await createSchool();
    const other = await createSchool();
    const hidden = await unverifiedSchool();
    const event = await createEvent(host.id, 7);
    const hiddenEvent = await createEvent(hidden.id, 7);

    for (const payload of [
      { type: "audition", title: "Audition", eventId: event.id },
      { type: "clinic", title: "Clinic", eventId: hiddenEvent.id },
      {
        type: "clinic",
        title: "Clinic",
        eventId: "00000000-0000-4000-8000-000000000000",
      },
      {
        type: "clinic",
        title: "Clinic",
        schoolId: other.id,
        eventId: event.id,
      },
    ]) {
      const response = await client
        .post("/tracker/items")
        .bearerToken(token)
        .json(payload);
      response.assertStatus(422);
    }

    const created = await client
      .post("/tracker/items")
      .bearerToken(token)
      .json({
        type: "clinic",
        title: "Clinic",
        schoolId: host.id,
        eventId: event.id,
      });
    created.assertStatus(201);

    const moved = await client
      .patch(`/tracker/items/${(created.body() as Item).id}`)
      .bearerToken(token)
      .json({ schoolId: other.id });
    moved.assertStatus(422);
  });
});
