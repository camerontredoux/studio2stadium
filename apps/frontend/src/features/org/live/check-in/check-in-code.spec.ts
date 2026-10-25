import { describe, expect, it } from "vitest";

import {
  formatCheckInTime,
  looksLikeCheckInCode,
  scanFailure,
} from "./check-in-code";

const CODE =
  "S2SCI1.va9_Ad0XQJOAMCRvrVAxJFF21RgQFkjYnWDZNAZTYGzqKfq8jHtm2tUUEliRwVpd";

describe("looksLikeCheckInCode", () => {
  it("accepts a pass code, with stray whitespace", () => {
    expect(looksLikeCheckInCode(CODE)).toBe(true);
    expect(looksLikeCheckInCode(` ${CODE}\n`)).toBe(true);
  });

  it("rejects bibs, links, and codes of the wrong length or prefix", () => {
    expect(looksLikeCheckInCode("101")).toBe(false);
    expect(looksLikeCheckInCode("https://example.com")).toBe(false);
    expect(looksLikeCheckInCode(CODE.slice(0, -1))).toBe(false);
    expect(looksLikeCheckInCode(`${CODE}A`)).toBe(false);
    expect(looksLikeCheckInCode(CODE.replace("S2SCI1", "S2SCI2"))).toBe(false);
    expect(looksLikeCheckInCode(CODE.replace("_", "+"))).toBe(false);
  });
});

describe("scanFailure", () => {
  it("maps each API error code", () => {
    expect(scanFailure({ code: "E_CHECK_IN_CODE_INVALID" })).toBe(
      "unrecognized",
    );
    expect(scanFailure({ code: "E_VALIDATION_ERROR" })).toBe("unrecognized");
    expect(scanFailure({ code: "E_CHECK_IN_CODE_WRONG_EVENT" })).toBe(
      "wrong-event",
    );
    expect(scanFailure({ code: "E_CHECK_IN_ROSTER_NOT_FOUND" })).toBe(
      "not-on-roster",
    );
  });

  it("treats anything else as a failed request", () => {
    expect(scanFailure({ code: "E_NOT_FOUND" })).toBe("failed");
    expect(scanFailure({ message: "Admin access required." })).toBe("failed");
    expect(scanFailure(new TypeError("Failed to fetch"))).toBe("failed");
    expect(scanFailure(undefined)).toBe("failed");
  });
});

describe("formatCheckInTime", () => {
  it("formats in 24-hour time", () => {
    const at = new Date(2026, 10, 13, 21, 5);
    expect(formatCheckInTime(at.toISOString())).toBe("21:05");
  });
});
