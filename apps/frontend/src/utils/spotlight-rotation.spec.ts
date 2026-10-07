import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
  });
}

/**
 * Simulate a fresh page load: a refresh reruns the module (resetting its
 * per-load memo) while localStorage persists across loads.
 */
async function loadAndRead(): Promise<number> {
  vi.resetModules();
  const { getSpotlightRotation } = await import("./spotlight-rotation");
  return getSpotlightRotation();
}

describe("spotlight rotation", () => {
  beforeEach(stubLocalStorage);
  afterEach(() => vi.unstubAllGlobals());

  it("defaults to 0 on the first load", async () => {
    expect(await loadAndRead()).toBe(0);
  });

  it("advances once per page load (refresh)", async () => {
    const RECOMMENDED_COUNT = 4;
    const featured: number[] = [];

    // Five refreshes: each load reads its rotation and advances for the next.
    for (let refresh = 0; refresh < 5; refresh += 1) {
      featured.push((await loadAndRead()) % RECOMMENDED_COUNT);
    }

    expect(featured).toEqual([0, 1, 2, 3, 0]);
  });

  it("wraps with modulo when there are fewer recommendations than loads", async () => {
    const RECOMMENDED_COUNT = 2;
    const featured: number[] = [];

    for (let refresh = 0; refresh < 4; refresh += 1) {
      featured.push((await loadAndRead()) % RECOMMENDED_COUNT);
    }

    expect(featured).toEqual([0, 1, 0, 1]);
  });

  it("returns the same rotation for repeated reads within one load", async () => {
    vi.resetModules();
    const { getSpotlightRotation } = await import("./spotlight-rotation");

    // The spotlight and its companion list both read during one load; they
    // must agree, and the rotation must not advance twice.
    expect(getSpotlightRotation()).toBe(0);
    expect(getSpotlightRotation()).toBe(0);

    // The next load picks up the advanced value.
    expect(await loadAndRead()).toBe(1);
  });
});
