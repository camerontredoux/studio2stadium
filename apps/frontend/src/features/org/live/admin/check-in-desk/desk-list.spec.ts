import { describe, expect, it } from "vitest";

import {
  type DeskDancer,
  checkInPercent,
  countDesk,
  dancerName,
  emptyMessage,
  formatCheckInTime,
  groupDesk,
  matchesQuery,
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

const ids = (rows: DeskDancer[]) => rows.map((r) => r.id);

describe("groupDesk", () => {
  it("lists Not yet by last then first name, then Checked in newest first", () => {
    const groups = groupDesk(roster, { filter: "all", query: "" });

    expect(groups.map((g) => g.label)).toEqual(["Not yet", "Checked in"]);
    expect(ids(groups[0].rows)).toEqual(["a", "c"]);
    expect(ids(groups[1].rows)).toEqual(["d", "e", "b"]);
  });

  it("shows only the group the filter asks for", () => {
    expect(
      groupDesk(roster, { filter: "out", query: "" }).map((g) => g.key),
    ).toEqual(["out"]);
    expect(
      groupDesk(roster, { filter: "in", query: "" }).map((g) => g.key),
    ).toEqual(["in"]);
  });

  it("drops a group with no rows", () => {
    const everyoneIn = roster.map((d) => ({
      ...d,
      checkedInAt: d.checkedInAt ?? "2026-10-24T10:00:00Z",
    }));

    expect(
      groupDesk(everyoneIn, { filter: "all", query: "" }).map((g) => g.key),
    ).toEqual(["in"]);
    expect(groupDesk(everyoneIn, { filter: "out", query: "" })).toEqual([]);
  });

  it("applies the search inside both groups", () => {
    const groups = groupDesk(roster, { filter: "all", query: "brooks" });

    expect(ids(groups[0].rows)).toEqual(["c"]);
    expect(ids(groups[1].rows)).toEqual(["e"]);
  });

  it("does not reorder the input", () => {
    const before = ids(roster);
    groupDesk(roster, { filter: "all", query: "" });
    expect(ids(roster)).toEqual(before);
  });
});

describe("matchesQuery", () => {
  const maya = roster[1];

  it("matches first, last and full name, ignoring case", () => {
    expect(matchesQuery(maya, "MAYA")).toBe(true);
    expect(matchesQuery(maya, "chen")).toBe(true);
    expect(matchesQuery(maya, "maya ch")).toBe(true);
    expect(matchesQuery(maya, "zoe")).toBe(false);
  });

  it("matches a bib from its start, with or without #", () => {
    expect(matchesQuery(maya, "10")).toBe(true);
    expect(matchesQuery(maya, "#101")).toBe(true);
    expect(matchesQuery(roster[3], "10")).toBe(false);
  });

  it("matches everything for a blank query", () => {
    expect(matchesQuery(maya, "   ")).toBe(true);
  });
});

describe("counts and percent", () => {
  it("counts checked in and not yet", () => {
    expect(countDesk(roster)).toEqual({ total: 5, checkedIn: 3, notYet: 2 });
  });

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
