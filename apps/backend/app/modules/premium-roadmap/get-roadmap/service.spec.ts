import { db } from "#database/connection";
import { premiumGrants } from "#database/schema/organizations";
import { follows, programViews } from "#database/schema/profiles";
import { videos, videoUploads } from "#database/schema/media";
import { premiumRoadmaps, subscriptions } from "#database/schema/subscriptions";
import { trackerItems } from "#database/schema/tracker";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { type Service as ProfileChecklistService } from "#modules/dancers/profile/get-profile-checklist/service";
import env from "#start/env";
import emitter from "@adonisjs/core/services/emitter";
import { faker } from "@faker-js/faker";
import { test } from "@japa/runner";
import { eq, sql } from "drizzle-orm";
import {
  createDancer,
  createSchool,
  DAY_MS,
  subscribe,
} from "#tests/helpers/premium";
import {
  GetRoadmapService,
  type Roadmap,
  type RoadmapDetails,
  type StepKey,
} from "./service.ts";

type Dancer = Awaited<ReturnType<typeof createDancer>>;

// The checklist rules belong to the feed's ProfileChecklist and are tested
// with it; here the roadmap only needs a complete or incomplete answer.
let profileComplete = true;
const checklist = {
  execute: async () => ({
    gpa: profileComplete,
    location: true,
    skills: true,
    styles: true,
    sports: true,
  }),
} as unknown as ProfileChecklistService;

const service = () => new GetRoadmapService(new DatabaseService(), checklist);

function eligible(result: Roadmap) {
  if (!result.eligible || !result.roadmap) {
    throw new Error("expected an eligible roadmap");
  }
  return result.roadmap;
}

function step(result: Roadmap | RoadmapDetails, key: StepKey) {
  const roadmap = "steps" in result ? result : eligible(result);
  return roadmap.steps.find((s) => s.key === key)!;
}

async function addVideo(dancer: Dancer) {
  await db.insert(videos).values({
    userId: dancer.id,
    mediaId: faker.string.alphanumeric(11),
  });
}

async function viewSchools(dancer: Dancer, count: number, at = new Date()) {
  for (let i = 0; i < count; i += 1) {
    const school = await createSchool();
    await db.insert(programViews).values({
      dancerId: dancer.profileId,
      schoolId: school.id,
      firstViewedAt: at,
    });
  }
}

test.group("GetRoadmapService", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${users} cascade`);
    profileComplete = true;
    env.set("PREMIUM_ROADMAP_ENABLED", true);
    return () => env.set("PREMIUM_ROADMAP_ENABLED", false);
  });

  test("is off when PREMIUM_ROADMAP_ENABLED is off", async ({ assert }) => {
    env.set("PREMIUM_ROADMAP_ENABLED", false);
    const dancer = await createDancer();
    await subscribe(dancer.id);

    assert.deepEqual(await service().execute(dancer), {
      eligible: false,
      roadmap: null,
    });
  });

  test("free dancers get no roadmap", async ({ assert }) => {
    const dancer = await createDancer();

    assert.deepEqual(await service().execute(dancer), {
      eligible: false,
      roadmap: null,
    });
  });

  test("monthly and annual subscribers get a roadmap with their interval", async ({
    assert,
  }) => {
    const monthly = await createDancer();
    const annual = await createDancer();
    await subscribe(monthly.id, { interval: "monthly" });
    await subscribe(annual.id, { interval: "annual" });

    const monthlyRoadmap = eligible(await service().execute(monthly));
    assert.equal(monthlyRoadmap.interval, "monthly");
    assert.equal(monthlyRoadmap.version, 1);
    assert.equal(monthlyRoadmap.daysSinceStart, 0);
    assert.equal(monthlyRoadmap.totalCount, 5);
    assert.equal(eligible(await service().execute(annual)).interval, "annual");
  });

  test("canceled subscribers get no roadmap", async ({ assert }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id, { status: "canceled" });

    assert.deepEqual(await service().execute(dancer), {
      eligible: false,
      roadmap: null,
    });
  });

  test("org-granted Premium gets no roadmap", async ({ assert }) => {
    const dancer = await createDancer();
    await db.insert(premiumGrants).values({
      userId: dancer.id,
      sourceType: "org_event",
      expiresAt: new Date(Date.now() + 30 * DAY_MS),
    });

    assert.deepEqual(await service().execute(dancer), {
      eligible: false,
      roadmap: null,
    });
  });

  test("members past day 30 get no new roadmap, but keep one they already have", async ({
    assert,
  }) => {
    const late = await createDancer();
    await subscribe(late.id, { startedAt: new Date(Date.now() - 31 * DAY_MS) });
    assert.deepEqual(await service().execute(late), {
      eligible: false,
      roadmap: null,
    });

    const existing = await createDancer();
    await subscribe(existing.id, { startedAt: new Date() });
    await service().execute(existing);
    await db
      .update(subscriptions)
      .set({ startedAt: new Date(Date.now() - 31 * DAY_MS) })
      .where(eq(subscriptions.userId, existing.id));
    await db
      .update(premiumRoadmaps)
      .set({ premiumStartedAt: new Date(Date.now() - 31 * DAY_MS) })
      .where(eq(premiumRoadmaps.userId, existing.id));

    assert.equal(
      eligible(await service().execute(existing)).daysSinceStart,
      31
    );
  });

  test("profile step follows the profile checklist", async ({ assert }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id);

    profileComplete = false;
    assert.equal(
      step(await service().execute(dancer), "profile").status,
      "incomplete"
    );

    profileComplete = true;
    const done = step(await service().execute(dancer), "profile");
    assert.equal(done.status, "complete");
    assert.instanceOf(done.completedAt, Date);
  });

  test("video step is processing while an upload is in progress, complete once a video exists", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id);
    assert.equal(
      step(await service().execute(dancer), "video").status,
      "incomplete"
    );

    await db.insert(videoUploads).values({
      userId: dancer.id,
      cloudflareMediaId: faker.string.alphanumeric(20),
      status: "processing",
    });
    assert.equal(
      step(await service().execute(dancer), "video").status,
      "processing"
    );

    await addVideo(dancer);
    assert.equal(
      step(await service().execute(dancer), "video").status,
      "complete"
    );
  });

  test("an upload stuck for over a day isn't shown as processing", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id);
    await db.insert(videoUploads).values({
      userId: dancer.id,
      cloudflareMediaId: faker.string.alphanumeric(20),
      status: "pending",
      createdAt: new Date(Date.now() - 2 * DAY_MS),
    });

    assert.equal(
      step(await service().execute(dancer), "video").status,
      "incomplete"
    );
  });

  test("program views step needs five schools viewed since Premium started", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const startedAt = new Date(Date.now() - DAY_MS);
    await subscribe(dancer.id, { startedAt });
    await viewSchools(dancer, 2, new Date(startedAt.getTime() - DAY_MS));
    await viewSchools(dancer, 4);

    const four = step(await service().execute(dancer), "program_views");
    assert.equal(four.status, "incomplete");
    assert.equal(four.count, 4);
    assert.equal(four.target, 5);

    await viewSchools(dancer, 1);
    const five = step(await service().execute(dancer), "program_views");
    assert.equal(five.status, "complete");
    assert.equal(five.count, 5);
  });

  test("tracker step needs an item added since Premium started", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    const startedAt = new Date(Date.now() - DAY_MS);
    await subscribe(dancer.id, { startedAt });
    await db.insert(trackerItems).values({
      dancerId: dancer.profileId,
      type: "deadline",
      title: "Before Premium",
      createdAt: new Date(startedAt.getTime() - DAY_MS),
    });
    assert.equal(
      step(await service().execute(dancer), "tracker").status,
      "incomplete"
    );

    await db.insert(trackerItems).values({
      dancerId: dancer.profileId,
      type: "clinic",
      title: "Summer intensive",
    });
    assert.equal(
      step(await service().execute(dancer), "tracker").status,
      "complete"
    );
  });

  test("favorite step is not ready until profile and video are done", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id);
    assert.equal(
      step(await service().execute(dancer), "favorite").status,
      "not_ready"
    );

    await addVideo(dancer);
    assert.equal(
      step(await service().execute(dancer), "favorite").status,
      "incomplete"
    );
  });

  test("an existing follow completes the favorite step without sending anything", async ({
    assert,
    cleanup,
  }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id);
    const school = await createSchool();
    await db
      .insert(follows)
      .values({ dancerId: dancer.profileId, schoolId: school.id });

    const events = emitter.fake();
    cleanup(() => emitter.restore());

    assert.equal(
      step(await service().execute(dancer), "favorite").status,
      "complete"
    );
    events.assertNoneEmitted();
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.dancerId, dancer.profileId));
    assert.equal(count, 1);
  });

  test("completion timestamps are kept after the step stops being true", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id);
    await addVideo(dancer);

    const first = eligible(await service().execute(dancer));
    const videoDoneAt = step(first, "video").completedAt;
    assert.instanceOf(videoDoneAt, Date);

    await db.delete(videos).where(eq(videos.userId, dancer.id));
    const second = eligible(await service().execute(dancer));
    assert.equal(step(second, "video").status, "incomplete");
    assert.equal(
      step(second, "video").completedAt?.getTime(),
      videoDoneAt!.getTime()
    );
    assert.equal(second.firstViewedAt.getTime(), first.firstViewedAt.getTime());
  });

  test("records roadmap completion once all five steps are done", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id);
    await addVideo(dancer);
    await viewSchools(dancer, 5);
    const school = await createSchool();
    await db.insert(trackerItems).values({
      dancerId: dancer.profileId,
      type: "school",
      schoolId: school.id,
    });
    const before = eligible(await service().execute(dancer));
    assert.equal(before.completedCount, 4);
    assert.isNull(before.completedAt);

    await db
      .insert(follows)
      .values({ dancerId: dancer.profileId, schoolId: school.id });
    const after = eligible(await service().execute(dancer));
    assert.equal(after.completedCount, 5);
    assert.instanceOf(after.completedAt, Date);
  });

  test("reports completions only on the request that first records them", async ({
    assert,
  }) => {
    const dancer = await createDancer();
    await subscribe(dancer.id);
    await addVideo(dancer);

    const first = eligible(await service().execute(dancer));
    assert.sameMembers(first.newlyCompleted, ["profile", "video"]);
    assert.isFalse(first.roadmapNewlyCompleted);

    const second = eligible(await service().execute(dancer));
    assert.deepEqual(second.newlyCompleted, []);

    await viewSchools(dancer, 5);
    const school = await createSchool();
    await db.insert(trackerItems).values({
      dancerId: dancer.profileId,
      type: "school",
      schoolId: school.id,
    });
    await db
      .insert(follows)
      .values({ dancerId: dancer.profileId, schoolId: school.id });
    const done = eligible(await service().execute(dancer));
    assert.sameMembers(done.newlyCompleted, [
      "program_views",
      "tracker",
      "favorite",
    ]);
    assert.isTrue(done.roadmapNewlyCompleted);

    const again = eligible(await service().execute(dancer));
    assert.deepEqual(again.newlyCompleted, []);
    assert.isFalse(again.roadmapNewlyCompleted);
  });
});
