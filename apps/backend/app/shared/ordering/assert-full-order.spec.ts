import { test } from "@japa/runner";
import { assertFullOrder } from "./assert-full-order.ts";

test.group("assertFullOrder", () => {
  test("accepts the same items in a new order", ({ assert }) => {
    assert.doesNotThrow(() =>
      assertFullOrder(["a", "b", "c"], ["c", "a", "b"])
    );
  });

  test("rejects a missing item", ({ assert }) => {
    assert.throws(() => assertFullOrder(["a", "b", "c"], ["c", "a"]));
  });

  test("rejects an item the owner does not have", ({ assert }) => {
    assert.throws(() => assertFullOrder(["a", "b"], ["a", "x"]));
  });

  test("rejects a duplicated item", ({ assert }) => {
    assert.throws(() => assertFullOrder(["a", "b"], ["a", "a", "b"]));
  });
});
