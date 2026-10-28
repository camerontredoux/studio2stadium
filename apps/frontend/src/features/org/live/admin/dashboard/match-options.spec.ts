import { describe, expect, it } from "vitest";

import {
  dancerOptionLabel,
  matchOptionGroups,
  soleNameMatch,
} from "./match-options";

const dancer = (
  id: string,
  firstName: string,
  lastName: string,
  bibNumber: number | null,
  isRegistered: boolean,
) => ({ id, firstName, lastName, bibNumber, isRegistered });

const roster = [
  dancer("a", "Jane", "Doe", 122, false),
  dancer("b", "Mary", "Miller", 126, true),
  dancer("c", "Jason", "Jones", 125, false),
  dancer("d", "Juna", "Park", null, true),
];

describe("dancerOptionLabel", () => {
  it("prefixes the bib when there is one", () => {
    expect(dancerOptionLabel(roster[0])).toBe("122 · Jane Doe");
    expect(dancerOptionLabel(roster[3])).toBe("Juna Park · already claimed");
  });

  it("adds the email so search finds it, and marks claimed rows", () => {
    expect(dancerOptionLabel({ ...roster[1], email: "mary@example.com" })).toBe(
      "126 · Mary Miller · mary@example.com · already claimed",
    );
    expect(dancerOptionLabel({ ...roster[0], email: "jane@example.com" })).toBe(
      "122 · Jane Doe · jane@example.com",
    );
  });
});

describe("matchOptionGroups", () => {
  it("puts name matches first, then not activated, then active", () => {
    const groups = matchOptionGroups(roster, {
      firstName: " jane ",
      lastName: "DOE",
    });
    expect(groups.map((g) => g.group)).toEqual([
      "Name matches",
      "Not activated",
      "Active",
    ]);
    expect(groups[0].options).toEqual([
      { value: "a", label: "122 · Jane Doe" },
    ]);
    expect(groups[1].options.map((o) => o.value)).toEqual(["c"]);
    expect(groups[2].options.map((o) => o.value)).toEqual(["b", "d"]);
  });

  it("leaves out empty groups", () => {
    const groups = matchOptionGroups([roster[1]], {
      firstName: "Nobody",
      lastName: "Here",
    });
    expect(groups.map((g) => g.group)).toEqual(["Active"]);
  });

  it("does not match on an empty last name", () => {
    const groups = matchOptionGroups(roster, { firstName: "", lastName: "" });
    expect(groups.map((g) => g.group)).toEqual(["Not activated", "Active"]);
  });
});

describe("soleNameMatch", () => {
  it("returns the only name match", () => {
    const groups = matchOptionGroups(roster, {
      firstName: "Jane",
      lastName: "Doe",
    });
    expect(soleNameMatch(groups)).toBe("a");
  });

  it("returns null for none or several", () => {
    const twins = [...roster, dancer("e", "Jane", "Doe", 300, false)];
    expect(
      soleNameMatch(
        matchOptionGroups(twins, { firstName: "Jane", lastName: "Doe" }),
      ),
    ).toBeNull();
    expect(
      soleNameMatch(
        matchOptionGroups(roster, { firstName: "X", lastName: "Y" }),
      ),
    ).toBeNull();
  });
});
