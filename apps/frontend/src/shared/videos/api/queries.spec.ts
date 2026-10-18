import { describe, expect, it } from "vitest";

import { uploadCheckGaveUp } from "./queries";

describe("uploadCheckGaveUp", () => {
  it("keeps polling through a few failed checks", () => {
    expect(uploadCheckGaveUp({ errorUpdateCount: 4 })).toBe(false);
  });

  it("stops polling once the checks keep failing", () => {
    expect(uploadCheckGaveUp({ errorUpdateCount: 5 })).toBe(true);
  });
});
