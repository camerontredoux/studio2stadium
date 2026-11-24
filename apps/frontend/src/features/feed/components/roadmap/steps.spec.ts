import { describe, expect, it } from "vitest";
import type { PremiumRoadmap } from "@/shared/premium-roadmap/types";
import { isHidden, missingProfileItems } from "./steps";

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

describe("isHidden", () => {
  const roadmap = (daysSinceStart: number, allDone: boolean) =>
    ({
      daysSinceStart,
      steps: [
        { key: "profile", status: "complete" },
        { key: "video", status: allDone ? "complete" : "incomplete" },
      ],
    }) as PremiumRoadmap;

  it("shows the card within the first 30 days", () => {
    expect(isHidden(roadmap(30, true))).toBe(false);
    expect(isHidden(roadmap(10, false))).toBe(false);
  });

  it("keeps an unfinished roadmap past day 30", () => {
    expect(isHidden(roadmap(45, false))).toBe(false);
  });

  it("hides a finished roadmap past day 30", () => {
    expect(isHidden(roadmap(31, true))).toBe(true);
  });
});
