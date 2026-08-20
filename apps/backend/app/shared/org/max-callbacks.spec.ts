import { test } from "@japa/runner";
import {
  DEFAULT_MAX_CALLBACKS_PER_COACH,
  UNLIMITED_CALLBACKS,
  resolveMaxCallbacks,
} from "./max-callbacks.ts";

test.group("resolveMaxCallbacks", () => {
  test("defaults when the setting is absent", ({ assert }) => {
    assert.equal(resolveMaxCallbacks({}), DEFAULT_MAX_CALLBACKS_PER_COACH);
    assert.equal(resolveMaxCallbacks(null), DEFAULT_MAX_CALLBACKS_PER_COACH);
    assert.equal(
      resolveMaxCallbacks({ max_callbacks_per_coach: null }),
      DEFAULT_MAX_CALLBACKS_PER_COACH
    );
  });

  test("reads a numeric setting", ({ assert }) => {
    assert.equal(resolveMaxCallbacks({ max_callbacks_per_coach: 8 }), 8);
  });

  test("reads a numeric string, as older writes stored it", ({ assert }) => {
    assert.equal(resolveMaxCallbacks({ max_callbacks_per_coach: "8" }), 8);
  });

  test("treats -1 as unlimited, as a number and as a string", ({ assert }) => {
    assert.equal(
      resolveMaxCallbacks({ max_callbacks_per_coach: -1 }),
      UNLIMITED_CALLBACKS
    );
    // A string "-1" previously slipped through as slice(0, "-1"), which drops
    // the last callback instead of publishing every one.
    assert.equal(
      resolveMaxCallbacks({ max_callbacks_per_coach: "-1" }),
      UNLIMITED_CALLBACKS
    );
  });

  test("treats 0 as unlimited rather than publishing nothing", ({ assert }) => {
    assert.equal(
      resolveMaxCallbacks({ max_callbacks_per_coach: 0 }),
      UNLIMITED_CALLBACKS
    );
  });

  test("falls back to the default for junk values", ({ assert }) => {
    assert.equal(
      resolveMaxCallbacks({ max_callbacks_per_coach: "lots" }),
      DEFAULT_MAX_CALLBACKS_PER_COACH
    );
  });
});
