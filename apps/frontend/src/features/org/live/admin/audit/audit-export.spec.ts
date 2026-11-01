import { describe, expect, it } from "vitest";

import type { AuditLogEntry } from "@/features/org/api/audit-queries";

import { auditCsv, auditCsvFilename, csvField } from "./audit-export";

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
  } as AuditLogEntry;
}

describe("csvField", () => {
  it("leaves plain values alone and blanks missing ones", () => {
    expect(csvField("Roster entry")).toBe("Roster entry");
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
  });

  it("quotes commas, quotes and line breaks", () => {
    expect(csvField("a, b")).toBe('"a, b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField("one\ntwo")).toBe('"one\ntwo"');
  });

  it("keeps spreadsheet formulas from running", () => {
    expect(csvField("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvField("@cmd")).toBe("'@cmd");
    expect(csvField("+1, 2")).toBe('"\'+1, 2"');
  });
});

describe("auditCsv", () => {
  it("writes the header and one row per entry with an ISO timestamp", () => {
    const csv = auditCsv([
      entry({
        action: "update",
        metadata: {
          field: "checkedInAt",
          before: null,
          after: "2026-10-24T10:00:00.000Z",
        },
        subject: {
          rosterId: "r1",
          bibNumber: 101,
          firstName: "Mary",
          lastName: "Miller",
          email: "mary@example.com",
          avatarUrl: null,
        },
      } as Partial<AuditLogEntry>),
      entry({
        id: "e2",
        action: "delete",
        resource: "video",
        resourceId: "v9",
      }),
    ]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(
      "Timestamp,Actor,Action,Resource,Resource ID,Dancer,Summary",
    );
    expect(lines).toHaveLength(3);
    expect(lines[1]).toMatch(
      /^2026-10-24T10:00:00\.000Z,Kaia Nugent,Check in,Roster entry,r1,101 · Mary Miller,Checked in$/,
    );
    expect(lines[2]).toMatch(
      /^2026-10-24T10:00:00\.000Z,Kaia Nugent,Delete,Video,v9,,/,
    );
  });

  it("writes only the header when nothing is loaded", () => {
    expect(auditCsv([])).toBe(
      "Timestamp,Actor,Action,Resource,Resource ID,Dancer,Summary",
    );
  });
});

describe("auditCsvFilename", () => {
  it("names the file after the event and the local day", () => {
    const now = new Date(2026, 9, 4, 12);
    expect(auditCsvFilename("The Summit 2026!", now)).toBe(
      "audit-log-the-summit-2026-2026-10-04.csv",
    );
    expect(auditCsvFilename(null, now)).toBe("audit-log-2026-10-04.csv");
  });
});
