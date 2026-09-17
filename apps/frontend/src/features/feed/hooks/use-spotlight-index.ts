import { getSpotlightRotation } from "@/utils/spotlight-rotation";
import { useState } from "react";

/**
 * Index into the recommended list to feature in the Program Spotlight.
 *
 * Snapshotted at mount so the spotlight and the Suggested Programs list stay in
 * sync for the whole session; the rotation itself advances once per login.
 */
export function useSpotlightIndex(length: number): number {
  const [rotation] = useState(getSpotlightRotation);
  if (length <= 0) return 0;
  return rotation % length;
}
