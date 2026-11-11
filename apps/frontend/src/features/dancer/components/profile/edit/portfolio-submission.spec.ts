import { describe, expect, it } from "vitest";
import { portfolioSubmission } from "./portfolio-submission";

const STORED = "I'm Avery.\n\n- Jazz\n- Pom";
const others = {
  gpa: 3.9,
  gradYear: 2027,
  location: "CO",
  birthday: { month: 4, day: 12, year: 2008 },
};

describe("portfolioSubmission", () => {
  it("sends a formatted biography as rich", () => {
    const edited = `${STORED}\n\n**Bold** and *italic*`;
    expect(
      portfolioSubmission({ ...others, biography: edited }, STORED),
    ).toEqual({ ...others, biography: edited, biographyFormat: "rich" });
  });

  it("sends a cleared biography as an empty string", () => {
    expect(portfolioSubmission({ ...others, biography: "" }, STORED)).toEqual({
      ...others,
      biography: "",
      biographyFormat: "rich",
    });
  });

  it("leaves the biography out of a GPA-only edit", () => {
    const body = portfolioSubmission(
      { ...others, gpa: 3.5, biography: STORED },
      STORED,
    );
    expect(body).toEqual({ ...others, gpa: 3.5 });
    expect(body).not.toHaveProperty("biography");
    expect(body).not.toHaveProperty("biographyFormat");
  });

  it("leaves the biography out after typing then reverting", () => {
    // Field value after typing "x" and deleting it again.
    const reverted = `${STORED}x`.slice(0, -1);
    expect(
      portfolioSubmission({ ...others, biography: reverted }, STORED),
    ).toEqual(others);
  });

  it("treats a missing stored biography as empty", () => {
    expect(portfolioSubmission({ ...others, biography: "" }, "")).toEqual(
      others,
    );
    expect(
      portfolioSubmission({ ...others, biography: "New bio" }, ""),
    ).toEqual({ ...others, biography: "New bio", biographyFormat: "rich" });
  });
});
