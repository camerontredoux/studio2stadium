import { describe, expect, it } from "vitest";

import {
  type DeskDancer,
  checkInPercent,
  dancerName,
  emptyMessage,
  formatCheckInTime,
} from "./desk-list";

function dancer(
  id: string,
  bibNumber: number | null,
  firstName: string,
  lastName: string,
  checkedInAt: string | null = null,
): DeskDancer {
  return { id, bibNumber, firstName, lastName, checkedInAt };
}

const roster: DeskDancer[] = [
  dancer("a", 230, "Zoe", "Adams"),
  dancer("b", 101, "Maya", "Chen", "2026-10-24T09:10:00Z"),
  dancer("c", 102, "Ava", "Brooks"),
  dancer("d", 210, "Liam", "Diaz", "2026-10-24T09:45:00Z"),
  dancer("e", 105, "Noah", "Brooks", "2026-10-24T09:30:00Z"),
];

describe("percent", () => {
  it("rounds to a whole percent and handles an empty roster", () => {
    expect(checkInPercent(1, 3)).toBe(33);
    expect(checkInPercent(2, 3)).toBe(67);
    expect(checkInPercent(0, 0)).toBe(0);
    expect(checkInPercent(5, 4)).toBe(100);
  });
});

describe("emptyMessage", () => {
  it("names the search when one is set", () => {
    expect(emptyMessage({ filter: "all", query: " zed ", total: 5 })).toBe(
      "No dancers match “zed”",
    );
  });

  it("says what is true for each filter", () => {
    expect(emptyMessage({ filter: "all", query: "", total: 0 })).toBe(
      "No dancers on the roster yet",
    );
    expect(emptyMessage({ filter: "out", query: "", total: 5 })).toBe(
      "Everyone is checked in",
    );
    expect(emptyMessage({ filter: "in", query: "", total: 5 })).toBe(
      "No one checked in yet",
    );
  });
});

describe("formatting", () => {
  it("falls back to a placeholder name", () => {
    expect(dancerName(dancer("x", 1, "", ""))).toBe("[Name]");
    expect(dancerName(roster[0])).toBe("Zoe Adams");
  });

  it("formats a 24-hour time", () => {
    expect(formatCheckInTime("2026-10-24T21:05:00")).toBe("21:05");
    expect(formatCheckInTime("not a date")).toBe("");
  });
});
