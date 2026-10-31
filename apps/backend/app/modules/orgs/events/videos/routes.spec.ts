import { db } from "#database/connection";
import {
  eventVideoCategories,
  eventVideos,
  orgEvents,
} from "#database/schema/org-events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { createDancer, login } from "#tests/helpers/premium";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const operations = [
  { method: "get", path: "videos" },
  { method: "get", path: "video-categories" },
  { method: "post", path: "videos" },
  { method: "patch", path: "videos/:videoId" },
  { method: "delete", path: "videos/:videoId" },
  { method: "post", path: "video-categories" },
  { method: "delete", path: "video-categories/:categoryId" },
  { method: "post", path: "videos/audio-upload-url" },
] as const;

test.group("Org Event video route scope", (group) => {
  group.each.setup(async () => {
    await db.delete(organizations);
    await db.delete(users);
  });

  async function fixture() {
    const user = await createDancer();
    const [org, otherOrg] = await db
      .insert(organizations)
      .values([
        { name: "Local Org", slug: "video-local" },
        { name: "Other Org", slug: "video-other" },
      ])
      .returning();
    await db.insert(orgMemberships).values({
      orgId: org!.id,
      userId: user.id,
      role: "admin",
      type: "coach",
    });
    const events = await db
      .insert(orgEvents)
      .values(
        [org!, otherOrg!].map((owner) => ({
          orgId: owner.id,
          name: "Active Event",
          startDate: "2026-06-01",
          endDate: "2026-06-02",
          isActive: true,
        }))
      )
      .returning();
    const event = events[1]!;
    const [category, emptyCategory] = await db
      .insert(eventVideoCategories)
      .values([
        { eventId: event.id, name: "Videos" },
        { eventId: event.id, name: "Empty" },
      ])
      .returning();
    const [video] = await db
      .insert(eventVideos)
      .values({
        eventId: event.id,
        categoryId: category!.id,
        title: "Original",
        youtubeId: "abcdefghijk",
      })
      .returning();
    return {
      user,
      org: org!,
      event,
      ownEvent: events[0]!,
      category: category!,
      emptyCategory: emptyCategory!,
      video: video!,
    };
  }

  for (const operation of operations) {
    test(`404 for another Org's event: ${operation.method} ${operation.path}`, async ({
      client,
    }) => {
      const { user, org, event, category, emptyCategory, video } =
        await fixture();
      const token = await login(client, user.email);
      const path = operation.path
        .replace(":videoId", video.id)
        .replace(":categoryId", emptyCategory.id);
      const url = `/orgs/${org.slug}/events/${event.id}/${path}`;
      const response =
        operation.method === "get" || operation.method === "delete"
          ? await client[operation.method](url).bearerToken(token)
          : await client[operation.method](url).bearerToken(token).json({
              title: "Changed",
              categoryId: category.id,
              youtubeId: "abcdefghijk",
              name: "New category",
              filename: "audio.mp3",
              contentType: "audio/mpeg",
            });
      response.assertStatus(404);
    });
  }

  test("staff can list videos and categories for their own event", async ({
    client,
  }) => {
    const { user, org, ownEvent: event } = await fixture();
    const token = await login(client, user.email);
    for (const path of ["videos", "video-categories"]) {
      const response = await client
        .get(`/orgs/${org.slug}/events/${event.id}/${path}`)
        .bearerToken(token);
      response.assertStatus(200);
    }
  });

  test("404 for a missing event on reads and writes", async ({ client }) => {
    const { user, org } = await fixture();
    const token = await login(client, user.email);
    const base = `/orgs/${org.slug}/events/${randomUUID()}`;
    const read = await client.get(`${base}/videos`).bearerToken(token);
    read.assertStatus(404);
    const write = await client
      .post(`${base}/video-categories`)
      .bearerToken(token)
      .json({ name: "Missing" });
    write.assertStatus(404);
  });

  test("Org admins can manage their own inactive event's videos and categories", async ({
    client,
  }) => {
    const { user, org, ownEvent } = await fixture();
    await db
      .update(orgEvents)
      .set({ isActive: false })
      .where(eq(orgEvents.id, ownEvent.id));
    const token = await login(client, user.email);
    const base = `/orgs/${org.slug}/events/${ownEvent.id}`;
    const category = await client
      .post(`${base}/video-categories`)
      .bearerToken(token)
      .json({ name: "Local" });
    category.assertStatus(201);
    const payload = {
      title: "Local",
      categoryId: category.body().id,
      youtubeId: "abcdefghijk",
    };
    const video = await client
      .post(`${base}/videos`)
      .bearerToken(token)
      .json(payload);
    video.assertStatus(201);
    const updated = await client
      .patch(`${base}/videos/${video.body().id}`)
      .bearerToken(token)
      .json({ ...payload, title: "Updated" });
    updated.assertStatus(200);
    const deletedVideo = await client
      .delete(`${base}/videos/${video.body().id}`)
      .bearerToken(token);
    deletedVideo.assertStatus(204);
    const deletedCategory = await client
      .delete(`${base}/video-categories/${category.body().id}`)
      .bearerToken(token);
    deletedCategory.assertStatus(204);
  });
});
