import { afterEach, describe, expect, it, vi } from "vitest";

import { openEventSchedule } from "./event-schedule-dialog-utils";

function stubWindow(isMobileViewport: boolean) {
  const open = vi.fn().mockReturnValue(null);
  vi.stubGlobal("window", {
    matchMedia: vi.fn().mockReturnValue({ matches: isMobileViewport }),
    open,
  });
  return open;
}

describe("openEventSchedule", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the file in a new tab on mobile instead of the dialog, since iOS Safari's embedded PDF/image viewer can't zoom back out", () => {
    const openSpy = stubWindow(true);
    const setOpen = vi.fn();

    openEventSchedule("https://example.com/schedule.pdf", setOpen);

    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com/schedule.pdf",
      "_blank",
      "noopener,noreferrer",
    );
    expect(setOpen).not.toHaveBeenCalled();
  });

  it("opens the dialog on desktop instead of a new tab", () => {
    const openSpy = stubWindow(false);
    const setOpen = vi.fn();

    openEventSchedule("https://example.com/schedule.pdf", setOpen);

    expect(openSpy).not.toHaveBeenCalled();
    expect(setOpen).toHaveBeenCalledWith(true);
  });
});
