import { describe, expect, it } from "vitest";

import { computeEventPhase } from "./use-event-phase";

describe("computeEventPhase", () => {
  it("labels the day after the end date as just wrapped", () => {
    const info = computeEventPhase(
      "2026-03-06",
      "2026-03-08",
      new Date(2026, 2, 9, 10),
    );
    expect(info.phase).toBe("wrapped");
    expect(info.label).toBe("Just wrapped");
  });

  it("counts days since the end after that", () => {
    const info = computeEventPhase(
      "2026-03-06",
      "2026-03-08",
      new Date(2026, 2, 10, 10),
    );
    expect(info.label).toBe("Wrapped 2 days ago");
  });
});
