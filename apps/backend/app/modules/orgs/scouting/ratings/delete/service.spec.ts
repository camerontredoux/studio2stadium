import { test } from "@japa/runner";
import { db } from "#database/connection";
import { eventRatings } from "#database/schema/event-features";
import { eq } from "drizzle-orm";
import {
  selectionFixture,
  type SelectionFixture,
} from "../../selections/test-fixtures.ts";
import { UpsertRatingService } from "../upsert/service.ts";
import { DeleteRatingService } from "./service.ts";

test.group("DeleteRatingService", (group) => {
  let f: SelectionFixture;
  const upsert = new UpsertRatingService();
  const service = new DeleteRatingService();

  group.each.setup(async () => {
    f = await selectionFixture();
    return () => f.cleanup();
  });

  const ratingsFor = (dancerRosterId: string) =>
    db
      .select({
        coach: eventRatings.coachRosterId,
        rating: eventRatings.rating,
      })
      .from(eventRatings)
      .where(eq(eventRatings.dancerRosterId, dancerRosterId));

  test("clears only this coach's rating of the dancer", async ({ assert }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const [a, b] = f.coaches;
    await upsert.execute(f.event.id, a!.id, dancer.id, 4);
    await upsert.execute(f.event.id, b!.id, dancer.id, 2);

    await service.execute(f.event.id, a!.id, dancer.id);

    assert.deepEqual(await ratingsFor(dancer.id), [
      { coach: b!.id, rating: 2 },
    ]);
  });

  test("clearing a dancer the coach never rated is a no-op", async ({
    assert,
  }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");

    await service.execute(f.event.id, f.coaches[0]!.id, dancer.id);

    assert.deepEqual(await ratingsFor(dancer.id), []);
  });
});
