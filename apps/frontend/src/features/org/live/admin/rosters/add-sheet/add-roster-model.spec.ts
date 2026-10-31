import { describe, expect, it } from "vitest";

import {
  addRosterFields,
  buildAddRosterBody,
  EMPTY_ADD_VALUES,
  mapAddRosterError,
  validateAddRoster,
} from "./add-roster-model";

describe("addRosterFields", () => {
  it("asks a dancer for the upload's dancer columns", () => {
    expect(
      addRosterFields("dancer", { freeTier: false, linked: false }),
    ).toEqual(["bibNumber", "firstName", "lastName", "email"]);
  });

  it("adds paid for a free-tier dancer", () => {
    expect(
      addRosterFields("dancer", { freeTier: true, linked: false }),
    ).toContain("paid");
  });

  it("asks a coach for a school, never a bib or paid", () => {
    expect(addRosterFields("coach", { freeTier: true, linked: false })).toEqual(
      ["firstName", "lastName", "email", "organization"],
    );
  });

  it("drops the email when an account is linked", () => {
    expect(
      addRosterFields("coach", { freeTier: false, linked: true }),
    ).not.toContain("email");
  });
});

describe("validateAddRoster", () => {
  it("requires every field it shows", () => {
    const fields = addRosterFields("dancer", { freeTier: true, linked: false });
    expect(
      Object.keys(validateAddRoster(EMPTY_ADD_VALUES, fields)).sort(),
    ).toEqual(["bibNumber", "email", "firstName", "lastName", "paid"]);
  });

  it("passes a complete coach", () => {
    const fields = addRosterFields("coach", { freeTier: false, linked: false });
    expect(
      validateAddRoster(
        {
          ...EMPTY_ADD_VALUES,
          firstName: "Cal",
          lastName: "Coach",
          email: "cal@usc.edu",
          organization: "USC",
        },
        fields,
      ),
    ).toEqual({});
  });

  it("rejects a bib that isn't a whole number above 0", () => {
    expect(
      validateAddRoster({ ...EMPTY_ADD_VALUES, bibNumber: "1.5" }, [
        "bibNumber",
      ]),
    ).toHaveProperty("bibNumber");
  });
});

describe("buildAddRosterBody", () => {
  it("sends the account's email and id when linked", () => {
    const fields = addRosterFields("dancer", { freeTier: true, linked: true });
    expect(
      buildAddRosterBody(
        "dancer",
        {
          ...EMPTY_ADD_VALUES,
          bibNumber: "12",
          firstName: " Ada ",
          lastName: "Lane",
          email: "typed@x.co",
          paid: "unpaid",
        },
        fields,
        { id: "u1", email: "ada@x.co" },
      ),
    ).toEqual({
      type: "dancer",
      firstName: "Ada",
      lastName: "Lane",
      email: "ada@x.co",
      bibNumber: 12,
      paid: false,
      userId: "u1",
    });
  });
});

describe("mapAddRosterError", () => {
  it("puts a taken email under the email field", () => {
    expect(
      mapAddRosterError({ code: "ROSTER_EMAIL_CONFLICT" }, false).fieldErrors,
    ).toEqual({ email: "This email is already on the roster." });
  });

  it("toasts a taken email when the account brought it", () => {
    const result = mapAddRosterError({ code: "ROSTER_EMAIL_CONFLICT" }, true);
    expect(result.fieldErrors).toEqual({});
    expect(result.message).toBe(
      "This account's email is already on the roster.",
    );
  });
});
