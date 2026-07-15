import { describe, expect, it } from "vitest";

import {
  EVENT_SCHEDULE_CONTENT_CLASS_NAME,
  EVENT_SCHEDULE_DIALOG_CLASS_NAME,
} from "./event-schedule-dialog";

describe("EventScheduleDialog", () => {
  it("bounds the mobile dialog and makes its schedule content scrollable", () => {
    expect(EVENT_SCHEDULE_DIALOG_CLASS_NAME).toContain("h-[calc(100svh-2rem)]");
    expect(EVENT_SCHEDULE_DIALOG_CLASS_NAME).toContain("sm:h-auto");
    expect(EVENT_SCHEDULE_CONTENT_CLASS_NAME).toContain("min-h-0");
    expect(EVENT_SCHEDULE_CONTENT_CLASS_NAME).toContain("flex-1");
    expect(EVENT_SCHEDULE_CONTENT_CLASS_NAME).toContain("overflow-auto");
    expect(EVENT_SCHEDULE_CONTENT_CLASS_NAME).toContain("sm:h-[80vh]");
  });
});
