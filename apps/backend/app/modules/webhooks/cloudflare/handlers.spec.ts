import { db } from "#database/connection";
import { videoUploads } from "#database/schema/media";
import { users } from "#database/schema/users";
import { createDancer } from "#tests/helpers/premium";
import emitter from "@adonisjs/core/services/emitter";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import { handleStreamWebhook } from "./handlers.ts";

const originalFetch = globalThis.fetch;

// Records every Cloudflare request and answers each with `status`.
function mockCloudflare(status: number) {
  const requests: { url: string; method?: string }[] = [];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), method: init?.method });
    return new Response(null, { status });
  };
  return requests;
}

async function createPendingUpload() {
  const dancer = await createDancer();
  const cloudflareMediaId = faker.string.alphanumeric(32);
  await db
    .insert(videoUploads)
    .values({ userId: dancer.id, cloudflareMediaId, status: "processing" });
  return cloudflareMediaId;
}

function errorPayload(uid: string) {
  return {
    uid,
    readyToStream: false,
    status: {
      state: "error" as const,
      errorReasonCode: "ERR_DURATION_EXCEED_CONSTRAINT",
    },
  };
}

async function uploadStatus(cloudflareMediaId: string) {
  const [row] = await db
    .select({ status: videoUploads.status })
    .from(videoUploads)
    .where(eq(videoUploads.cloudflareMediaId, cloudflareMediaId));
  return row?.status;
}

test.group("Cloudflare Stream webhook / error", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    emitter.fake();
    return () => {
      globalThis.fetch = originalFetch;
      emitter.restore();
    };
  });

  test("marks the upload failed and deletes the Stream entry", async ({
    assert,
  }) => {
    const uid = await createPendingUpload();
    const requests = mockCloudflare(200);

    await handleStreamWebhook(errorPayload(uid));

    assert.equal(await uploadStatus(uid), "failed");
    assert.lengthOf(requests, 1);
    assert.equal(requests[0].method, "DELETE");
    assert.isTrue(requests[0].url.endsWith(`/stream/${uid}`));
  });

  test("still marks the upload failed when Cloudflare refuses the delete", async ({
    assert,
  }) => {
    const uid = await createPendingUpload();
    mockCloudflare(500);

    await handleStreamWebhook(errorPayload(uid));

    assert.equal(await uploadStatus(uid), "failed");
  });
});
