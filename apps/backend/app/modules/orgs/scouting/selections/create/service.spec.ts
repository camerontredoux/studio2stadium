import { test } from "@japa/runner";
import { selectionFixture, type SelectionFixture } from "../test-fixtures.ts";
import { CreateSelectionService } from "./service.ts";

test.group("CreateSelectionService", (group) => {
  let f: SelectionFixture;
  const service = new CreateSelectionService();

  group.each.setup(async () => {
    f = await selectionFixture();
    return () => f.cleanup();
  });

  test("each new choice is ranked after the existing ones", async ({
    assert,
  }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const [a, b] = f.coaches;

    await service.execute(f.event.id, dancer.id, a!.id);
    await service.execute(f.event.id, dancer.id, b!.id);

    assert.deepEqual(await f.ranks(f.event.id, dancer.id), [
      [a!.id, 1],
      [b!.id, 2],
    ]);
  });

  test("a fourth school is refused when the limit is 3", async ({ assert }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const [a, b, c, d] = f.coaches;
    await f.select(f.event.id, dancer.id, [a!.id, b!.id, c!.id]);

    const result = await service.execute(f.event.id, dancer.id, d!.id, 3);

    assert.deepEqual(result, { error: "max_selections" });
    assert.lengthOf(await f.ranks(f.event.id, dancer.id), 3);
  });

  test("re-adding a school already chosen at the limit returns it unchanged", async ({
    assert,
  }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const [a, b, c] = f.coaches;
    await f.select(f.event.id, dancer.id, [a!.id, b!.id, c!.id]);

    const result = await service.execute(f.event.id, dancer.id, b!.id, 3);

    assert.equal(result.data?.rank, 2);
    assert.lengthOf(await f.ranks(f.event.id, dancer.id), 3);
  });

  test("parallel adds get distinct ranks and stop at the limit", async ({
    assert,
  }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");

    const results = await Promise.all(
      f.coaches.map((coach) =>
        service.execute(f.event.id, dancer.id, coach.id, 3)
      )
    );

    assert.lengthOf(
      results.filter((r) => "error" in r),
      1
    );
    const ranks = await f.ranks(f.event.id, dancer.id);
    assert.deepEqual(
      ranks.map(([, rank]) => rank),
      [1, 2, 3]
    );
  });
});
