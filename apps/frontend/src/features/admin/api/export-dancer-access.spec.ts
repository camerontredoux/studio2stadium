import { describe, expect, it } from "vitest";
import { exportFilename } from "./export-dancer-access";

describe("exportFilename", () => {
  it("uses the backend's attachment filename", () => {
    expect(
      exportFilename(
        'attachment; filename="dancer-access-2026-11-27T12-00-00-000Z.csv"',
      ),
    ).toBe("dancer-access-2026-11-27T12-00-00-000Z.csv");
  });

  it("falls back to a dated name when the header is missing", () => {
    expect(exportFilename(null, new Date("2026-11-27T12:00:00Z"))).toBe(
      "dancer-access-2026-11-27.csv",
    );
  });
});
