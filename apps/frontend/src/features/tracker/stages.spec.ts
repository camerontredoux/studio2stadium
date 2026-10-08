import { describe, expect, it } from "vitest";

import { completesAll } from "./stages";

const open = (id: string) => ({ id, completedAt: null });
const done = (id: string) => ({ id, completedAt: "2026-10-01T12:00:00.000Z" });

describe("completesAll", () => {
  it("is true when checking the last open milestone", () => {
    expect(completesAll([done("a"), open("b")], "b")).toBe(true);
  });

  it("is false while another milestone is still open", () => {
    expect(completesAll([open("a"), open("b")], "b")).toBe(false);
  });

  it("is false when unchecking a completed milestone", () => {
    expect(completesAll([done("a"), done("b")], "b")).toBe(false);
  });
});
