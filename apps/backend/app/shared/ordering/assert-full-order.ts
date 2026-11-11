import { E_BAD_REQUEST } from "#exceptions/bad-request";

/**
 * A reorder request must list every item the owner has, each once. Anything
 * else means the client's list is stale (an item was added or removed in
 * another tab), and saving it would leave some items without a position.
 */
export function assertFullOrder(current: string[], requested: string[]) {
  const have = new Set(current);
  const want = new Set(requested);

  const matches =
    want.size === requested.length &&
    want.size === have.size &&
    requested.every((key) => have.has(key));

  if (!matches) {
    throw new E_BAD_REQUEST(
      "This list changed since you loaded it. Refresh the page and try again."
    );
  }
}
