import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  advanceSpotlightRotation,
  getSpotlightRotation,
} from "./spotlight-rotation";

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

describe("spotlight rotation", () => {
  beforeEach(stubLocalStorage);
  afterEach(() => vi.unstubAllGlobals());

  it("defaults to 0 before any login", () => {
    expect(getSpotlightRotation()).toBe(0);
  });

  it("cycles through programs 0-3 across successive logins", () => {
    const RECOMMENDED_COUNT = 4;
    const featured: number[] = [];

    // Five logins: the spotlight index is read as `rotation % count` on the
    // feed after each login advances the rotation.
    for (let login = 0; login < 5; login += 1) {
      advanceSpotlightRotation();
      featured.push(getSpotlightRotation() % RECOMMENDED_COUNT);
    }

    expect(featured).toEqual([0, 1, 2, 3, 0]);
  });

  it("wraps with modulo when there are fewer recommendations than logins", () => {
    const RECOMMENDED_COUNT = 2;
    const featured: number[] = [];

    for (let login = 0; login < 4; login += 1) {
      advanceSpotlightRotation();
      featured.push(getSpotlightRotation() % RECOMMENDED_COUNT);
    }

    expect(featured).toEqual([0, 1, 0, 1]);
  });
});
