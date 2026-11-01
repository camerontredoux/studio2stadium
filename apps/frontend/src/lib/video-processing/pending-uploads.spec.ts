import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readPendingUploads,
  STORAGE_KEY,
  uploadOutcome,
} from "./pending-uploads";

function stubStorage(value: string | null) {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => (key === STORAGE_KEY ? value : null),
  });
}

describe("readPendingUploads", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores every upload still processing after a reload", () => {
    stubStorage(JSON.stringify(["first", "second"]));

    expect(readPendingUploads()).toEqual(["first", "second"]);
  });

  it("starts empty when the stored value is unreadable", () => {
    stubStorage("not json");

    expect(readPendingUploads()).toEqual([]);
  });
});

describe("uploadOutcome", () => {
  it("keeps waiting while Cloudflare has not finished", () => {
    expect(uploadOutcome({ status: "pending" })).toBe("processing");
    expect(uploadOutcome({ status: "processing" })).toBe("processing");
  });

  it("reports a finished upload as ready or failed", () => {
    expect(uploadOutcome({ status: "ready" })).toBe("ready");
    expect(uploadOutcome({ status: "failed" })).toBe("failed");
  });

  it("stops following an upload the server no longer has", () => {
    expect(uploadOutcome(null)).toBe("gone");
  });
});
