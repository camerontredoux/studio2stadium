import { describe, expect, it } from "vitest";
import { missingProfileItems } from "./steps";

const complete = {
  gpa: true,
  location: true,
  skills: true,
  skillCount: 12,
  styles: true,
  sports: true,
};

describe("missingProfileItems", () => {
  it("lists nothing for a complete profile", () => {
    expect(missingProfileItems(complete)).toEqual([]);
  });

  it("lists only the missing items, with the skill count", () => {
    expect(
      missingProfileItems({
        ...complete,
        skills: false,
        skillCount: 3,
        gpa: false,
      }),
    ).toEqual(["Select 7 more skills (3/10)", "Enter your GPA"]);
  });
});
