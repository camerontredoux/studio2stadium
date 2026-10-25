import { useSyncExternalStore } from "react";

import { SHELL_MEDIA } from "@/components/event/shell/breakpoints";

function subscribePhone(onChange: () => void) {
  const mql = window.matchMedia(SHELL_MEDIA.phone);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** True at the phone breakpoint (≤800px), for copy CSS can't swap (placeholders). */
export function useIsPhone() {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(SHELL_MEDIA.phone).matches,
    () => false,
  );
}
