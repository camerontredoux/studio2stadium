import { test } from "@japa/runner";
import { selectionFixture, type SelectionFixture } from "../test-fixtures.ts";
import { DeleteSelectionService } from "./service.ts";

test.group("DeleteSelectionService", (group) => {
  let f: SelectionFixture;
  const service = new DeleteSelectionService();

  group.each.setup(async () => {
    f = await selectionFixture();
    return () => f.cleanup();
  });

  test("removing the middle choice moves the one below it up", async ({
    assert,
  }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const [a, b, c] = f.coaches;
    const rows = await f.select(f.event.id, dancer.id, [a!.id, b!.id, c!.id]);

    const removed = await service.execute(f.event.id, dancer.id, rows[1]!.id);

    assert.equal(removed?.coachRosterId, b!.id);
    assert.deepEqual(await f.ranks(f.event.id, dancer.id), [
      [a!.id, 1],
      [c!.id, 2],
    ]);
  });

  test("removing the first choice renumbers every rank", async ({ assert }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const [a, b, c] = f.coaches;
    const rows = await f.select(f.event.id, dancer.id, [a!.id, b!.id, c!.id]);

    await service.execute(f.event.id, dancer.id, rows[0]!.id);

    assert.deepEqual(await f.ranks(f.event.id, dancer.id), [
      [b!.id, 1],
      [c!.id, 2],
    ]);
  });

  test("a dancer cannot remove another dancer's choice", async ({ assert }) => {
    const ada = await f.roster(f.event.id, "dancer", "Ada");
    const ben = await f.roster(f.event.id, "dancer", "Ben");
    const [a, b] = f.coaches;
    const adaRows = await f.select(f.event.id, ada.id, [a!.id, b!.id]);

    assert.isNull(await service.execute(f.event.id, ben.id, adaRows[0]!.id));
    assert.deepEqual(await f.ranks(f.event.id, ada.id), [
      [a!.id, 1],
      [b!.id, 2],
    ]);
  });

  test("a choice from another Org Event cannot be removed through the active one", async ({
    assert,
  }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const coach = await f.roster(f.otherEvent.id, "coach", "Echo");
    const [past] = await f.select(f.otherEvent.id, dancer.id, [coach.id]);

    assert.isNull(await service.execute(f.event.id, dancer.id, past!.id));
    assert.lengthOf(await f.ranks(f.otherEvent.id, dancer.id), 1);
  });
});
