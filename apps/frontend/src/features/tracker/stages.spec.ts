import { describe, expect, it } from "vitest";

import { reachedAll } from "./stages";

const open = { completedAt: null };
const done = { completedAt: "2026-10-01T12:00:00.000Z" };

describe("reachedAll", () => {
  it("is true when every milestone is reached", () => {
    expect(reachedAll([done, done])).toBe(true);
  });

  it("is false while a milestone is still open", () => {
    expect(reachedAll([done, open])).toBe(false);
  });

  it("is false for a school with no milestones", () => {
    expect(reachedAll([])).toBe(false);
  });
});
