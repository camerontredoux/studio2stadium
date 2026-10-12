import { describe, expect, it } from "vitest";

import {
  canSubmitCommonRecruitingVideo,
  graduatingClass,
} from "./common-recruiting";

// Noon Denver is 18:00 or 19:00 UTC, so these land on the named Denver day.
const denver = (date: string) => new Date(`${date}T19:00:00Z`);

describe("graduatingClass", () => {
  it("is that year's class in the spring and the next year's in the fall", () => {
    expect(graduatingClass(denver("2027-05-15"))).toBe(2027);
    expect(graduatingClass(denver("2026-10-12"))).toBe(2027);
    expect(graduatingClass(denver("2027-09-01"))).toBe(2028);
  });

  it("rolls over at August 1 midnight Denver, not UTC", () => {
    // 05:59 UTC on August 1 is still July 31 in Denver.
    expect(graduatingClass(new Date("2027-08-01T05:59:00Z"))).toBe(2027);
    expect(graduatingClass(new Date("2027-08-01T06:00:00Z"))).toBe(2028);
  });
});

describe("canSubmitCommonRecruitingVideo", () => {
  const fall2026 = denver("2026-10-12");

  it("allows this cycle's seniors and older", () => {
    expect(canSubmitCommonRecruitingVideo(2027, fall2026)).toBe(true);
    expect(canSubmitCommonRecruitingVideo(2025, fall2026)).toBe(true);
  });

  it("blocks younger dancers and dancers with no grad year", () => {
    expect(canSubmitCommonRecruitingVideo(2028, fall2026)).toBe(false);
    expect(canSubmitCommonRecruitingVideo(null, fall2026)).toBe(false);
  });
});
