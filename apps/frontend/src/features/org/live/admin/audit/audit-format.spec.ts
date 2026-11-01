import { describe, expect, it } from "vitest";

import type { AuditLogEntry } from "@/features/org/api/audit-queries";

import {
  buildAuditDiff,
  displayAction,
  relativeTime,
  summarizeEntry,
} from "./audit-format";

function entry(overrides: Partial<AuditLogEntry>): AuditLogEntry {
  return {
    id: "e1",
    createdAt: "2026-10-24T10:00:00.000Z",
    eventId: "ev1",
    action: "update",
    resource: "roster",
    resourceId: "r1",
    metadata: null,
    parentId: null,
    actor: {
      id: "u1",
      firstName: "Kaia",
      lastName: "Nugent",
      email: "kaia@example.com",
      avatarUrl: null,
    },
    childCount: 0,
    subject: null,
    ...overrides,
  };
}

describe("relativeTime", () => {
  const now = new Date("2026-10-24T12:00:00Z");
  it.each([
    ["2026-10-24T11:59:40Z", "Just now"],
    ["2026-10-24T11:25:00Z", "35m ago"],
    ["2026-10-24T09:46:00Z", "2h ago"],
    ["2026-10-23T09:00:00Z", "1 day ago"],
    ["2026-08-20T12:00:00Z", "2 months ago"],
  ])("%s → %s", (at, expected) => {
    expect(relativeTime(at, now)).toBe(expected);
  });
});

describe("check-ins", () => {
  // The API records a check-in as a roster update of checkedInAt; the log
  // shows it as its own action, and an undo reads differently from a check-in.
  const checkIn = entry({
    metadata: {
      field: "checkedInAt",
      before: null,
      after: "2026-10-24T10:12:00.000Z",
    },
  });
  const undo = entry({
    metadata: {
      field: "checkedInAt",
      before: "2026-10-24T10:12:00.000Z",
      after: null,
    },
  });

  it("is listed as a check in, not an update", () => {
    expect(displayAction(checkIn)).toBe("check_in");
    expect(displayAction(entry({ metadata: { field: "paid" } }))).toBe(
      "update",
    );
  });

  it("summarises check-ins and undos", () => {
    expect(summarizeEntry(checkIn)).toBe("Checked in");
    expect(summarizeEntry(undo)).toBe("Check-in undone");
  });

  it("diffs the single field with a dash for the empty side", () => {
    const diff = buildAuditDiff(checkIn, "UTC");
    expect(diff.variant).toBe("diff");
    expect(diff.rows).toHaveLength(1);
    expect(diff.rows[0]).toMatchObject({ field: "checkedInAt", before: null });
    expect(diff.rows[0]?.after).toMatch(/^Oct 24, 2026 · 10:12:00/);
  });
});

describe("buildAuditDiff", () => {
  it("splits an update into changed rows and unchanged fields", () => {
    const diff = buildAuditDiff(
      entry({
        metadata: {
          before: {
            firstName: "Mary",
            lastName: "Miller",
            email: "mary@example.com",
            bibNumber: 126,
            organization: null,
          },
          after: { email: "new@example.com", firstName: "Mary" },
        },
      }),
    );
    expect(diff.variant).toBe("diff");
    expect(diff.rows).toEqual([
      { field: "email", before: "mary@example.com", after: "new@example.com" },
    ]);
    // Empty values aren't listed as unchanged.
    expect(diff.unchanged).toEqual([
      { field: "firstName", value: "Mary" },
      { field: "lastName", value: "Miller" },
      { field: "bibNumber", value: "126" },
    ]);
  });

  it("lists a create's values and a delete's removed values", () => {
    const created = buildAuditDiff(
      entry({
        action: "create",
        resource: "video",
        metadata: { after: { title: "Jazz solo", url: "" } },
      }),
    );
    expect(created).toMatchObject({
      variant: "values",
      valuesLabel: "Value",
      rows: [{ field: "title", before: null, after: "Jazz solo" }],
    });

    const deleted = buildAuditDiff(
      entry({ action: "delete", metadata: { before: { email: "a@b.co" } } }),
    );
    expect(deleted).toMatchObject({
      variant: "values",
      valuesLabel: "Removed value",
      rows: [{ field: "email", before: "a@b.co", after: null }],
    });
  });

  it("lists an upload's counts as values", () => {
    const diff = buildAuditDiff(
      entry({
        action: "upload",
        resource: "csv_upload",
        metadata: { type: "dancer", rowsAdded: 3, rowsErrored: 0 },
      }),
    );
    expect(diff.variant).toBe("values");
    expect(diff.rows.map((r) => [r.field, r.after])).toEqual([
      ["type", "dancer"],
      ["rowsAdded", "3"],
      ["rowsErrored", "0"],
    ]);
  });

  it("has no rows when nothing was recorded", () => {
    expect(buildAuditDiff(entry({ metadata: null })).rows).toEqual([]);
  });
});
