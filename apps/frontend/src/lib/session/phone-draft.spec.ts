import { afterEach, describe, expect, it, vi } from "vitest";

import { clearPhoneDrafts, phoneDraftKeyFor } from "./phone-draft";

function stubSessionStorage(entries: Record<string, string>) {
  const store = new Map(Object.entries(entries));
  vi.stubGlobal("sessionStorage", {
    get length() {
      return store.size;
    },
    key: (i: number) => [...store.keys()][i] ?? null,
    removeItem: (key: string) => store.delete(key),
  });
  return store;
}

describe("clearPhoneDrafts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("removes every user's phone draft and keeps other keys", () => {
    const store = stubSessionStorage({
      [phoneDraftKeyFor("user-1")]: "5551234567",
      [phoneDraftKeyFor("user-2")]: "5559876543",
      other: "kept",
    });

    clearPhoneDrafts();

    expect([...store.keys()]).toEqual(["other"]);
  });
});
