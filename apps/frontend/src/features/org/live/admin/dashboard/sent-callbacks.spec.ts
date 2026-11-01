import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readSent, sentCallbacksKey, setSent } from "./sent-callbacks";

function stubStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
}

describe("sent callbacks", () => {
  beforeEach(() => stubStorage());
  afterEach(() => vi.unstubAllGlobals());

  it("keeps marks per event and showcase, and unmarks one dancer", () => {
    const first = sentCallbacksKey("event-1", "showcase-1");
    const second = sentCallbacksKey("event-1", "showcase-2");

    setSent(first, "dancer-a", true);
    setSent(first, "dancer-b", true);
    setSent(first, "dancer-a", false);

    expect(readSent(first)).toEqual(["dancer-b"]);
    expect(readSent(second)).toEqual([]);
  });

  it("starts empty when the stored value is unreadable", () => {
    stubStorage({ [sentCallbacksKey("event-1", "showcase-1")]: "not json" });

    expect(readSent(sentCallbacksKey("event-1", "showcase-1"))).toEqual([]);
  });
});
