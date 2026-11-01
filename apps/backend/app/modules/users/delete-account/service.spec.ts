import { db } from "#database/connection";
import { videoUploads, videos } from "#database/schema/media";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { createDancer } from "#tests/helpers/premium";
import emitter from "@adonisjs/core/services/emitter";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import { Service } from "./service.ts";

const originalFetch = globalThis.fetch;

// Records every Cloudflare DELETE and answers each with `status`.
function mockCloudflare(status: number) {
  const deleted: string[] = [];
  globalThis.fetch = async (input, init) => {
    if (init?.method === "DELETE") {
      deleted.push(String(input).split("/stream/")[1]);
    }
    return new Response(null, { status });
  };
  return deleted;
}

async function createDancerWithVideos() {
  const dancer = await createDancer();
  const [ready] = await db
    .insert(videos)
    .values({
      userId: dancer.id,
      mediaId: faker.string.alphanumeric(32),
      type: "cloudflare",
    })
    .returning();
  await db.insert(videos).values({
    userId: dancer.id,
    mediaId: faker.string.alphanumeric(11),
    type: "youtube",
  });
  const failedUid = faker.string.alphanumeric(32);
  await db.insert(videoUploads).values([
    {
      userId: dancer.id,
      cloudflareMediaId: ready.mediaId,
      status: "ready",
      videoId: ready.id,
    },
    { userId: dancer.id, cloudflareMediaId: failedUid, status: "failed" },
  ]);
  return { dancer, streamUids: [ready.mediaId, failedUid] };
}

function deleteAccount(dancer: Awaited<ReturnType<typeof createDancer>>) {
  return new Service(new DatabaseService()).execute({
    id: dancer.id,
    displayEmail: dancer.displayEmail,
    firstName: dancer.firstName,
    role: dancer.role,
  });
}

async function userExists(id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id));
  return rows.length > 0;
}

test.group("Users / delete account / Stream videos", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    emitter.fake();
    return () => {
      globalThis.fetch = originalFetch;
      emitter.restore();
    };
  });

  test("deletes the user's uploaded and profile Stream videos once each", async ({
    assert,
  }) => {
    const { dancer, streamUids } = await createDancerWithVideos();
    const deleted = mockCloudflare(200);

    await deleteAccount(dancer);

    assert.isFalse(await userExists(dancer.id));
    assert.sameMembers(deleted, streamUids);
  });

  test("still deletes the account when Cloudflare fails", async ({
    assert,
  }) => {
    const { dancer } = await createDancerWithVideos();
    mockCloudflare(500);

    await deleteAccount(dancer);

    assert.isFalse(await userExists(dancer.id));
  });
});
