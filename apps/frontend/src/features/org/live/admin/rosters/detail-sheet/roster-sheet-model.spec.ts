import { describe, expect, it } from "vitest";

import {
  buildRosterPatch,
  callbackChipLabel,
  callbackChipTitle,
  changedFields,
  checkInSummary,
  editableFields,
  formFromEntry,
  initials,
  mapRosterSaveError,
  type DancerCallback,
  validateRosterFields,
} from "./roster-sheet-model";

const dancer = {
  type: "dancer" as const,
  isRegistered: false,
  bibNumber: 101,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  organization: null,
  profile: {
    studio: null,
    gpa: 3.8,
    gradYear: 2027,
    profilePhotoUrl: null,
    state: null,
    danceStyles: null,
    bio: null,
  },
};

describe("editableFields", () => {
  it("leaves a registered dancer only the bib", () => {
    expect(editableFields({ type: "dancer", isRegistered: true })).toEqual([
      "bibNumber",
    ]);
  });

  it("locks every field of a registered coach", () => {
    expect(editableFields({ type: "coach", isRegistered: true })).toEqual([]);
  });

  it("lets admins edit a pending dancer's roster and profile fields", () => {
    expect(editableFields({ type: "dancer", isRegistered: false })).toEqual([
      "bibNumber",
      "firstName",
      "lastName",
      "email",
      "gradYear",
      "gpa",
    ]);
  });

  it("lets admins edit a pending coach's school", () => {
    expect(editableFields({ type: "coach", isRegistered: false })).toContain(
      "organization",
    );
  });
});

describe("changedFields and buildRosterPatch", () => {
  const saved = formFromEntry(dancer);
  const fields = editableFields(dancer);

  it("reports nothing changed for untouched or whitespace-only edits", () => {
    expect(
      changedFields(saved, { ...saved, firstName: " Jane " }, fields),
    ).toEqual([]);
  });

  it("sends only the changed fields, parsed, with profile fields nested", () => {
    const values = { ...saved, bibNumber: "102", gpa: "", lastName: "Roe " };
    const changed = changedFields(saved, values, fields);
    expect(changed).toEqual(["bibNumber", "lastName", "gpa"]);
    expect(buildRosterPatch(values, changed)).toEqual({
      bibNumber: 102,
      lastName: "Roe",
      profile: { gpa: null },
    });
  });

  it("ignores fields the entry does not allow", () => {
    const values = { ...saved, firstName: "Janet" };
    expect(changedFields(saved, values, ["bibNumber"])).toEqual([]);
  });

  it("clears a bib and an empty school to null", () => {
    expect(
      buildRosterPatch({ ...saved, bibNumber: "", organization: "  " }, [
        "bibNumber",
        "organization",
      ]),
    ).toEqual({ bibNumber: null, organization: null });
  });
});

describe("validateRosterFields", () => {
  const values = formFromEntry(dancer);

  it("accepts valid values and empty optional numbers", () => {
    expect(
      validateRosterFields({ ...values, bibNumber: "", gpa: "" }, [
        "bibNumber",
        "gpa",
        "email",
      ]),
    ).toEqual({});
  });

  it("rejects what the backend validator rejects", () => {
    expect(
      validateRosterFields(
        {
          ...values,
          firstName: " ",
          email: "jane@",
          bibNumber: "0",
          gradYear: "1899",
          gpa: "5.1",
        },
        ["firstName", "email", "bibNumber", "gradYear", "gpa"],
      ),
    ).toEqual({
      firstName: "Enter a first name.",
      email: "Enter a valid email.",
      bibNumber: "Use a whole number above 0.",
      gradYear: "Use a year from 1900 to 2100.",
      gpa: "Use a number from 0 to 5.",
    });
  });

  it("rejects a fractional bib", () => {
    expect(
      validateRosterFields({ ...values, bibNumber: "1.5" }, ["bibNumber"]),
    ).toHaveProperty("bibNumber");
  });
});

describe("mapRosterSaveError", () => {
  it("puts a bib conflict under the bib field", () => {
    expect(
      mapRosterSaveError({ code: "ROSTER_BIB_CONFLICT", message: "Conflict" }),
    ).toEqual({
      fieldErrors: { bibNumber: "Another entry already has this bib." },
      message: "Another entry already has this bib.",
    });
  });

  it("maps nested profile validation errors to their fields", () => {
    const { fieldErrors } = mapRosterSaveError({
      errors: [{ field: "profile.gpa", message: "Too high" }],
    });
    expect(fieldErrors).toEqual({ gpa: "Too high" });
  });

  it("falls back to the server message when no field matches", () => {
    expect(
      mapRosterSaveError({ code: "ROSTER_ACTIVE_READONLY", message: "Locked" }),
    ).toEqual({ fieldErrors: {}, message: "Locked" });
  });

  it("names a network failure", () => {
    expect(mapRosterSaveError(new TypeError("fetch")).message).toMatch(
      /connection/,
    );
  });
});

describe("labels", () => {
  it("builds initials and a fallback", () => {
    expect(initials("juna", "park")).toBe("JP");
    expect(initials("", null)).toBe("?");
  });

  it("summarises check-in in 24-hour time", () => {
    const at = new Date(2026, 9, 24, 14, 5).toISOString();
    expect(checkInSummary(at)).toBe("Checked in 14:05");
    expect(checkInSummary(null)).toBe("Not checked in");
  });

  const callback: DancerCallback = {
    username: null,
    firstName: "Sam",
    lastName: "Lee",
    organization: "UCLA",
    coachRosterId: "c1",
    avatarUrl: null,
    showcaseNumbers: [3, 1],
    latestShowcaseNumber: 3,
    callbackCount: 2,
    releasedCount: 1,
  };

  it("labels a callback chip by school and latest showcase", () => {
    expect(callbackChipLabel(callback)).toBe("UCLA · Showcase 3 +1");
    expect(
      callbackChipLabel({
        ...callback,
        organization: null,
        showcaseNumbers: [2],
        latestShowcaseNumber: 2,
      }),
    ).toBe("Sam Lee · Showcase 2");
  });

  it("titles a callback chip with its showcases and publish state", () => {
    expect(callbackChipTitle(callback)).toBe(
      "Showcase 3, 1 · 1 of 2 published",
    );
    expect(callbackChipTitle({ ...callback, releasedCount: 2 })).toBe(
      "Showcase 3, 1 · published",
    );
  });
});
