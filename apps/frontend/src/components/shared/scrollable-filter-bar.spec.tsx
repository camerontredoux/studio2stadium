import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ScrollableFilterBar } from "./scrollable-filter-bar";

function classesOf(html: string) {
  const match = /class="([^"]*)"/.exec(html);
  return (match?.[1] ?? "").split(" ");
}

describe("ScrollableFilterBar", () => {
  it("keeps controls on one row that scrolls horizontally without a visible scrollbar", () => {
    const classes = classesOf(
      renderToString(<ScrollableFilterBar>filters</ScrollableFilterBar>),
    );

    expect(classes).toEqual(
      expect.arrayContaining([
        "flex",
        "flex-nowrap",
        "overflow-x-auto",
        "scrollbar-none",
        "*:shrink-0",
      ]),
    );
    expect(classes).not.toContain("flex-wrap");
  });

  it("merges row styling and renders its children", () => {
    const html = renderToString(
      <ScrollableFilterBar className="gap-2 border-b px-3 py-2">
        <input placeholder="Search..." />
      </ScrollableFilterBar>,
    );

    expect(classesOf(html)).toEqual(
      expect.arrayContaining(["gap-2", "border-b", "px-3", "py-2"]),
    );
    expect(html).toContain('placeholder="Search..."');
    expect(html).toContain('data-slot="scrollable-filter-bar"');
  });

  it("lets a caller override the default alignment", () => {
    const classes = classesOf(
      renderToString(
        <ScrollableFilterBar className="items-stretch">x</ScrollableFilterBar>,
      ),
    );

    expect(classes).toContain("items-stretch");
    expect(classes).not.toContain("items-center");
  });
});
