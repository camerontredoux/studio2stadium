import { test } from "@japa/runner";
import { selectionFixture, type SelectionFixture } from "../test-fixtures.ts";
import { MoveSelectionService } from "./service.ts";

test.group("MoveSelectionService", (group) => {
  let f: SelectionFixture;
  const service = new MoveSelectionService();

  group.each.setup(async () => {
    f = await selectionFixture();
    return () => f.cleanup();
  });

  test("moving down swaps a choice with the one below it", async ({
    assert,
  }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const [a, b, c] = f.coaches;
    const [first] = await f.select(f.event.id, dancer.id, [
      a!.id,
      b!.id,
      c!.id,
    ]);

    const result = await service.execute(
      f.event.id,
      dancer.id,
      first!.id,
      "down"
    );

    assert.notProperty(result, "error");
    assert.deepEqual(await f.ranks(f.event.id, dancer.id), [
      [b!.id, 1],
      [a!.id, 2],
      [c!.id, 3],
    ]);
    // The response is the new order, as GET my-selections returns it.
    assert.deepEqual(
      "data" in result
        ? result.data.map((row) => [row.coachRosterId, row.rank])
        : [],
      [
        [b!.id, 1],
        [a!.id, 2],
        [c!.id, 3],
      ]
    );
  });

  test("moving up swaps a choice with the one above it", async ({ assert }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const [a, b, c] = f.coaches;
    const rows = await f.select(f.event.id, dancer.id, [a!.id, b!.id, c!.id]);

    await service.execute(f.event.id, dancer.id, rows[2]!.id, "up");

    assert.deepEqual(await f.ranks(f.event.id, dancer.id), [
      [a!.id, 1],
      [c!.id, 2],
      [b!.id, 3],
    ]);
  });

  test("the first choice cannot move up and the last cannot move down", async ({
    assert,
  }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const [a, b] = f.coaches;
    const rows = await f.select(f.event.id, dancer.id, [a!.id, b!.id]);

    assert.deepEqual(
      await service.execute(f.event.id, dancer.id, rows[0]!.id, "up"),
      { error: "at_edge" }
    );
    assert.deepEqual(
      await service.execute(f.event.id, dancer.id, rows[1]!.id, "down"),
      { error: "at_edge" }
    );
    assert.deepEqual(await f.ranks(f.event.id, dancer.id), [
      [a!.id, 1],
      [b!.id, 2],
    ]);
  });

  test("a dancer cannot move another dancer's choice", async ({ assert }) => {
    const ada = await f.roster(f.event.id, "dancer", "Ada");
    const ben = await f.roster(f.event.id, "dancer", "Ben");
    const [a, b] = f.coaches;
    const adaRows = await f.select(f.event.id, ada.id, [a!.id, b!.id]);
    await f.select(f.event.id, ben.id, [a!.id, b!.id]);

    const result = await service.execute(
      f.event.id,
      ben.id,
      adaRows[0]!.id,
      "down"
    );

    assert.deepEqual(result, { error: "not_found" });
    assert.deepEqual(await f.ranks(f.event.id, ada.id), [
      [a!.id, 1],
      [b!.id, 2],
    ]);
  });

  test("a choice from another Org Event cannot be moved through the active one", async ({
    assert,
  }) => {
    const dancer = await f.roster(f.event.id, "dancer", "Ada");
    const coachA = await f.roster(f.otherEvent.id, "coach", "Echo");
    const coachB = await f.roster(f.otherEvent.id, "coach", "Foxtrot");
    const pastRows = await f.select(f.otherEvent.id, dancer.id, [
      coachA.id,
      coachB.id,
    ]);

    const result = await service.execute(
      f.event.id,
      dancer.id,
      pastRows[0]!.id,
      "down"
    );

    assert.deepEqual(result, { error: "not_found" });
    assert.deepEqual(await f.ranks(f.otherEvent.id, dancer.id), [
      [coachA.id, 1],
      [coachB.id, 2],
    ]);
  });
});
