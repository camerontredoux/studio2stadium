import { test } from "@japa/runner";
import { parseSuppressions } from "./parse.ts";

// Every address below uses reserved example domains; none is real.
const sender = (
  email: string,
  status: string,
  dates: { unsubscribed_at?: string | null; bounced_at?: string | null } = {}
) => ({
  email,
  status: { email: status, temail: "active" },
  unsubscribed_at: dates.unsubscribed_at ?? null,
  bounced_at: dates.bounced_at ?? null,
});

test.group("Suppression exports: parsing", () => {
  test("Sender statuses map to reasons, with the matching date", ({
    assert,
  }) => {
    const parsed = parseSuppressions(
      "sender",
      JSON.stringify([
        sender(" One@Example.COM ", "unsubscribed", {
          unsubscribed_at: "2026-03-01T10:00:00Z",
        }),
        sender("two@example.org", "bounced", {
          bounced_at: "2026-03-02T10:00:00Z",
        }),
        sender("three@example.net", "spam_reported", {
          unsubscribed_at: "2026-03-03T10:00:00Z",
        }),
      ])
    );

    assert.deepEqual(parsed.problems, []);
    assert.deepEqual(
      parsed.records.map((r) => [r.email, r.source, r.reason]),
      [
        ["one@example.com", "sender", "unsubscribed"],
        ["two@example.org", "sender", "bounced"],
        ["three@example.net", "sender", "complained"],
      ]
    );
    assert.equal(
      parsed.records[1]!.sourceRecordedAt!.toISOString(),
      "2026-03-02T10:00:00.000Z"
    );
  });

  test("SES entries map BOUNCE and COMPLAINT, bare or in the CLI wrapper", ({
    assert,
  }) => {
    const items = [
      {
        EmailAddress: "a@example.com",
        LastUpdateTime: "2026-01-05T00:00:00+00:00",
        Reason: "BOUNCE",
      },
      {
        EmailAddress: "b@example.com",
        LastUpdateTime: 1767225600,
        Reason: "COMPLAINT",
      },
    ];
    for (const contents of [
      JSON.stringify(items),
      JSON.stringify({ SuppressedDestinationSummaries: items }),
    ]) {
      const parsed = parseSuppressions("ses", contents);
      assert.deepEqual(parsed.problems, []);
      assert.deepEqual(
        parsed.records.map((r) => [r.email, r.source, r.reason]),
        [
          ["a@example.com", "ses", "bounced"],
          ["b@example.com", "ses", "complained"],
        ]
      );
    }
  });

  test("removal requests are one address per line, skipping blanks and comments", ({
    assert,
  }) => {
    const parsed = parseSuppressions(
      "removals",
      "# requested removals\n\n  First@Example.com  \r\nsecond@example.com\n# done\n"
    );
    assert.deepEqual(parsed.problems, []);
    assert.equal(parsed.entries, 2);
    assert.deepEqual(
      parsed.records.map((r) => [r.email, r.source, r.reason]),
      [
        ["first@example.com", "manual", "removal_requested"],
        ["second@example.com", "manual", "removal_requested"],
      ]
    );
  });

  test("repeats collapse to one address, keeping the newest statement", ({
    assert,
  }) => {
    const parsed = parseSuppressions(
      "sender",
      JSON.stringify([
        sender("same@example.com", "unsubscribed", {
          unsubscribed_at: "2026-01-01T00:00:00Z",
        }),
        sender("SAME@example.com", "bounced", {
          bounced_at: "2026-02-01T00:00:00Z",
        }),
      ])
    );
    assert.equal(parsed.duplicates, 1);
    assert.lengthOf(parsed.records, 1);
    assert.equal(parsed.records[0]!.reason, "bounced");
  });

  test("one bad entry rejects the whole file, and problems never echo addresses", ({
    assert,
  }) => {
    const parsed = parseSuppressions(
      "sender",
      JSON.stringify([
        sender("good@example.com", "unsubscribed"),
        sender("not-an-address", "unsubscribed"),
        sender("other@example.com", "active"),
        { email: "x@example.com" },
        sender("late@example.com", "bounced", { bounced_at: "yesterday" }),
      ])
    );

    assert.lengthOf(parsed.records, 0);
    assert.deepEqual(
      parsed.problems.map((p) => p.entry),
      [2, 3, 4, 5]
    );
    const text = JSON.stringify(parsed.problems);
    for (const address of ["not-an-address", "other@", "x@", "late@"]) {
      assert.notInclude(text, address);
    }
  });

  test("files that are not the expected shape are refused", ({ assert }) => {
    assert.equal(
      parseSuppressions("ses", "{not json").problems[0]!.problem,
      "the file is not valid JSON"
    );
    assert.equal(
      parseSuppressions("sender", '{"email":"a@example.com"}').problems[0]!
        .problem,
      "the file is not a JSON array"
    );
    assert.lengthOf(
      parseSuppressions(
        "ses",
        JSON.stringify([{ EmailAddress: "a@example.com", Reason: "OTHER" }])
      ).problems,
      1
    );
    assert.lengthOf(
      parseSuppressions("removals", "ok@example.com\nbad address\n").records,
      0
    );
  });
});
