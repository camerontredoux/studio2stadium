import { getSpotlightRotation } from "@/utils/spotlight-rotation";
import { useState } from "react";

/**
 * Index into the recommended list to feature in the Spotlight.
 *
 * Snapshotted at mount so the spotlight and the Suggested list stay in sync for
 * the whole page load; the rotation itself advances once per load, so a tab
 * refresh features the next item.
 */
export function useSpotlightIndex(length: number): number {
  const [rotation] = useState(getSpotlightRotation);
  if (length <= 0) return 0;
  return rotation % length;
}
