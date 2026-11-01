import { describe, expect, it } from "vitest";

import {
  EMPTY_FILTERS,
  multiChipLabel,
  presetHint,
  resolveDateRange,
  toListParams,
  type AuditFilters,
} from "./audit-filters";

const now = new Date(2026, 9, 24, 15, 30);
const event = { startDate: "2026-10-22", endDate: "2026-10-24" };

function filters(overrides: Partial<AuditFilters>): AuditFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

describe("resolveDateRange", () => {
  it("covers the event's days from its first midnight to its last", () => {
    const { from, to } = resolveDateRange(
      filters({ date: "event" }),
      now,
      event,
    );
    expect(from).toEqual(new Date(2026, 9, 22));
    expect(to).toEqual(new Date(2026, 9, 24, 23, 59, 59, 999));
  });

  it("makes a one-day custom range cover that whole day", () => {
    const day = new Date(2026, 9, 1);
    const { from, to } = resolveDateRange(
      filters({ date: "custom", customStart: day, customEnd: null }),
      now,
      event,
    );
    expect(from).toEqual(day);
    expect(to).toEqual(new Date(2026, 9, 1, 23, 59, 59, 999));
  });

  it("starts today at midnight and leaves the end open", () => {
    expect(resolveDateRange(filters({ date: "today" }), now, event)).toEqual({
      from: new Date(2026, 9, 24),
    });
  });
});

describe("resolveDateRange in the event's zone", () => {
  // The event is in New York (EDT, UTC-4), whatever the viewer's zone is.
  const newYork = { ...event, timeZone: "America/New_York" };

  it("covers the event's days from New York midnight to New York midnight", () => {
    const { from, to } = resolveDateRange(
      filters({ date: "event" }),
      now,
      newYork,
    );
    expect(from?.toISOString()).toBe("2026-10-22T04:00:00.000Z");
    expect(to?.toISOString()).toBe("2026-10-25T03:59:59.999Z");
  });

  it("starts today at New York midnight", () => {
    // 02:00 UTC on the 25th is still the 24th in New York.
    const late = new Date(Date.UTC(2026, 9, 25, 2));
    expect(
      resolveDateRange(
        filters({ date: "today" }),
        late,
        newYork,
      ).from?.toISOString(),
    ).toBe("2026-10-24T04:00:00.000Z");
  });

  it("reads a picked custom day as that day in New York", () => {
    const day = new Date(2026, 10, 1);
    const { from, to } = resolveDateRange(
      filters({ date: "custom", customStart: day, customEnd: null }),
      now,
      newYork,
    );
    // Nov 1 is the day New York leaves daylight saving: 25 hours long.
    expect(from?.toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(to?.toISOString()).toBe("2026-11-02T04:59:59.999Z");
  });
});

describe("toListParams", () => {
  it("passes every selected action and resource to the API", () => {
    expect(
      toListParams(
        filters({
          actions: ["check_in", "delete"],
          resources: ["video", "event"],
          search: " mary ",
        }),
        now,
        null,
      ),
    ).toMatchObject({
      actions: ["check_in", "delete"],
      resources: ["video", "event"],
      search: "mary",
    });
  });

  it("leaves out empty selections", () => {
    const params = toListParams(filters({}), now, null);
    expect(params.actions).toBeUndefined();
    expect(params.resources).toBeUndefined();
  });
});

describe("labels", () => {
  it("names the chip by its selection", () => {
    expect(multiChipLabel("Action", [])).toBe("Action");
    expect(multiChipLabel("Action", ["Delete"])).toBe("Delete");
    expect(multiChipLabel("Action", ["Delete", "Create"])).toBe("Action · 2");
  });

  it("hints today's date and the event's span", () => {
    expect(presetHint("today", now, event)).toBe("Oct 24");
    expect(presetHint("event", now, event)).toBe("Oct 22–24");
    expect(
      presetHint("event", now, {
        startDate: "2026-10-30",
        endDate: "2026-11-02",
      }),
    ).toBe("Oct 30–Nov 2");
  });
});
