import { describe, expect, it } from "vitest";

import type { RosterEntry } from "@/features/org/api/roster-queries";

import {
  bulkCheckInPlan,
  gridTemplates,
  mergePages,
  nextSort,
  rosterColumns,
  rosterSearchSchema,
} from "./roster-config";

function entry(id: string, checkedInAt: string | null = null): RosterEntry {
  return { id, checkedInAt } as RosterEntry;
}

describe("rosterSearchSchema", () => {
  it("defaults status to all and drops values it doesn't know", () => {
    expect(rosterSearchSchema.parse({})).toEqual({ status: "all" });
    expect(
      rosterSearchSchema.parse({ status: "nope", sort: "password", dir: "up" }),
    ).toEqual({ status: "all" });
  });

  it("keeps a pending deep link with a search and sort", () => {
    expect(
      rosterSearchSchema.parse({
        status: "pending",
        q: "jane",
        sort: "bibNumber",
        dir: "desc",
      }),
    ).toEqual({ status: "pending", q: "jane", sort: "bibNumber", dir: "desc" });
  });
});

describe("rosterColumns", () => {
  it("adds paid and checked in for dancers only when the flags are on", () => {
    const ids = (checkIn: boolean, freeTier: boolean) =>
      rosterColumns("dancer", { checkIn, freeTier }).map((c) => c.id);
    expect(ids(false, false)).toEqual(["bib", "name", "email", "status"]);
    expect(ids(true, true)).toEqual([
      "bib",
      "name",
      "email",
      "status",
      "paid",
      "checkedIn",
    ]);
    expect(
      rosterColumns("coach", { checkIn: true, freeTier: true }).map(
        (c) => c.id,
      ),
    ).toEqual(["name", "email", "school", "status"]);
  });

  it("drops the columns phones hide from the phone template", () => {
    const dancers = gridTemplates(
      rosterColumns("dancer", { checkIn: true, freeTier: false }),
    );
    expect(dancers.columns).toBe(
      "64px minmax(120px,1fr) minmax(180px,1.5fr) 96px 96px",
    );
    expect(dancers.phoneColumns).toBe("56px minmax(72px,1fr) 64px 84px");
  });
});

describe("nextSort", () => {
  it("starts ascending, then flips", () => {
    expect(nextSort({}, "lastName")).toEqual({ sort: "lastName", dir: "asc" });
    expect(nextSort({ sort: "lastName", dir: "asc" }, "lastName")).toEqual({
      sort: "lastName",
      dir: "desc",
    });
    expect(nextSort({ sort: "lastName", dir: "desc" }, "email")).toEqual({
      sort: "email",
      dir: "asc",
    });
  });
});

describe("mergePages", () => {
  it("keeps page order and drops repeats", () => {
    expect(
      mergePages([
        [entry("a"), entry("b")],
        undefined,
        [entry("b"), entry("c")],
      ]).map((r) => r.id),
    ).toEqual(["a", "b", "c"]);
  });
});

describe("bulkCheckInPlan", () => {
  it("checks in only the dancers who aren't yet", () => {
    const plan = bulkCheckInPlan([
      entry("a", "2026-10-24T10:12:00Z"),
      entry("b"),
    ]);
    expect(plan.label).toBe("Check in");
    expect(plan.targets.map((r) => r.id)).toEqual(["b"]);
  });

  it("undoes everyone when all are checked in", () => {
    const plan = bulkCheckInPlan([
      entry("a", "2026-10-24T10:12:00Z"),
      entry("b", "2026-10-24T10:13:00Z"),
    ]);
    expect(plan.label).toBe("Undo check-in");
    expect(plan.targets).toHaveLength(2);
  });
});
