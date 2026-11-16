import { db } from "#database/connection";
import { emailSuppressions } from "#database/schema/week-pass-emails";
import { test } from "@japa/runner";
import { asc, sql } from "drizzle-orm";
import { applySuppressionImport, previewSuppressionImport } from "./import.ts";
import type { SuppressionRecord } from "./parse.ts";

const rec = (
  email: string,
  reason: SuppressionRecord["reason"],
  at: string | null,
  source: SuppressionRecord["source"] = "sender"
): SuppressionRecord => ({
  email,
  source,
  reason,
  sourceRecordedAt: at ? new Date(at) : null,
});

const rows = () =>
  db
    .select()
    .from(emailSuppressions)
    .orderBy(asc(emailSuppressions.email), asc(emailSuppressions.source));

test.group("Suppression import", (group) => {
  group.each.setup(async () => {
    await db.execute(sql`truncate table ${emailSuppressions}`);
  });

  test("a dry run counts what would change and writes nothing", async ({
    assert,
  }) => {
    const counts = await previewSuppressionImport("sender", [
      rec("a@example.com", "unsubscribed", "2026-01-01T00:00:00Z"),
      rec("b@example.com", "bounced", "2026-01-02T00:00:00Z"),
    ]);
    assert.deepEqual(counts, {
      added: 2,
      refreshed: 0,
      unchanged: 0,
      alreadySuppressedElsewhere: 0,
    });
    assert.lengthOf(await rows(), 0);
  });

  test("applying adds rows, and applying the same file again changes nothing", async ({
    assert,
  }) => {
    const file = [
      rec("a@example.com", "unsubscribed", "2026-01-01T00:00:00Z"),
      rec("b@example.com", "bounced", "2026-01-02T00:00:00Z"),
    ];

    const first = await applySuppressionImport("sender", file);
    assert.equal(first.added, 2);
    const before = await rows();

    const second = await applySuppressionImport("sender", file);
    assert.deepEqual(second, {
      added: 0,
      refreshed: 0,
      unchanged: 2,
      alreadySuppressedElsewhere: 0,
    });
    const after = await rows();
    assert.deepEqual(
      after.map((r) => [r.email, r.reason, r.updatedAt.getTime()]),
      before.map((r) => [r.email, r.reason, r.updatedAt.getTime()])
    );
  });

  test("other sources and addresses missing from a later file are kept", async ({
    assert,
  }) => {
    await applySuppressionImport("ses", [
      rec("a@example.com", "bounced", "2026-01-01T00:00:00Z", "ses"),
    ]);
    await applySuppressionImport("sender", [
      rec("a@example.com", "unsubscribed", "2026-01-03T00:00:00Z"),
      rec("gone@example.com", "unsubscribed", "2026-01-03T00:00:00Z"),
    ]);

    // A later Sender export no longer lists either address.
    const counts = await applySuppressionImport("sender", [
      rec("new@example.com", "unsubscribed", "2026-02-01T00:00:00Z"),
    ]);
    assert.equal(counts.added, 1);

    const all = await rows();
    assert.deepEqual(
      all.map((r) => [r.email, r.source, r.reason]),
      [
        ["a@example.com", "sender", "unsubscribed"],
        ["a@example.com", "ses", "bounced"],
        ["gone@example.com", "sender", "unsubscribed"],
        ["new@example.com", "sender", "unsubscribed"],
      ]
    );
  });

  test("a newer statement refreshes a row; an older one never overwrites it", async ({
    assert,
  }) => {
    await applySuppressionImport("sender", [
      rec("a@example.com", "unsubscribed", "2026-02-01T00:00:00Z"),
    ]);

    const older = await applySuppressionImport("sender", [
      rec("a@example.com", "bounced", "2026-01-01T00:00:00Z"),
    ]);
    assert.equal(older.unchanged, 1);
    let [row] = await rows();
    assert.equal(row!.reason, "unsubscribed");

    const newer = await applySuppressionImport("sender", [
      rec("a@example.com", "bounced", "2026-03-01T00:00:00Z"),
    ]);
    assert.equal(newer.refreshed, 1);
    [row] = await rows();
    assert.equal(row!.reason, "bounced");
    assert.equal(
      row!.sourceRecordedAt!.toISOString(),
      "2026-03-01T00:00:00.000Z"
    );
  });

  test("an address another source already suppresses is counted as such", async ({
    assert,
  }) => {
    await applySuppressionImport("manual", [
      rec("a@example.com", "removal_requested", null, "manual"),
    ]);
    const counts = await previewSuppressionImport("ses", [
      rec(
        "A@example.com".toLowerCase(),
        "bounced",
        "2026-01-01T00:00:00Z",
        "ses"
      ),
    ]);
    assert.equal(counts.added, 1);
    assert.equal(counts.alreadySuppressedElsewhere, 1);
  });

  test("a failure partway through writes nothing at all", async ({
    assert,
  }) => {
    const file = Array.from({ length: 700 }, (_, i) =>
      rec(`user${i}@example.com`, "unsubscribed", "2026-01-01T00:00:00Z")
    );
    // The last entry breaks the reason check, after the first 500 were sent.
    file[699] = {
      ...file[699]!,
      reason: "bogus" as SuppressionRecord["reason"],
    };

    await assert.rejects(() => applySuppressionImport("sender", file));
    assert.lengthOf(await rows(), 0);
  });

  test("records from another source are refused", async ({ assert }) => {
    await assert.rejects(
      () =>
        applySuppressionImport("sender", [
          rec("a@example.com", "bounced", null, "ses"),
        ]),
      /source being imported/
    );
    assert.lengthOf(await rows(), 0);
  });
});
