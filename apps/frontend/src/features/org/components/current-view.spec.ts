import { describe, expect, it } from "vitest";

import { viewForPathname } from "./current-view";

describe("viewForPathname", () => {
  it.each([
    ["/o/prodigy/admin", "Admin"],
    ["/o/prodigy/admin/coaches", "Admin"],
    ["/o/prodigy/coach", "Coach"],
    ["/o/prodigy/coach/dancers", "Coach"],
    ["/o/prodigy/dancer", "Dancer"],
    ["/o/prodigy/dancer/coaches", "Dancer"],
    ["/o/prodigy/dancer/", "Dancer"],
  ] as const)("%s is %s", (pathname, view) => {
    expect(viewForPathname(pathname)).toBe(view);
  });

  it("is not fooled by an org slug that contains a view name", () => {
    expect(viewForPathname("/o/coach-academy/dancer")).toBe("Dancer");
    expect(viewForPathname("/o/admin-dance/dancer/coaches")).toBe("Dancer");
  });
});
