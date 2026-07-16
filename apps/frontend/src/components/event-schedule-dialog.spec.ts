import { describe, expect, it } from "vitest";

import {
  EVENT_SCHEDULE_CONTENT_CLASS_NAME,
  EVENT_SCHEDULE_DIALOG_CLASS_NAME,
} from "./event-schedule-dialog";

describe("EventScheduleDialog", () => {
  it("opens nearly full-screen on mobile without changing the desktop layout", () => {
    expect(EVENT_SCHEDULE_DIALOG_CLASS_NAME).toContain("max-sm:h-[100svh]");
    expect(EVENT_SCHEDULE_DIALOG_CLASS_NAME).toContain("max-sm:max-w-none");
    expect(EVENT_SCHEDULE_DIALOG_CLASS_NAME).toContain("max-w-5xl");
    expect(EVENT_SCHEDULE_DIALOG_CLASS_NAME).toContain("sm:h-auto");
  });

  it("lets the iframe be the sole scroll/zoom surface instead of nesting it in a scrollable wrapper", () => {
    expect(EVENT_SCHEDULE_CONTENT_CLASS_NAME).toContain("overflow-hidden");
    expect(EVENT_SCHEDULE_CONTENT_CLASS_NAME).not.toContain("overflow-auto");
  });
});
