import * as React from "react";

import { matches, SHELL_MEDIA } from "@/components/event/shell/breakpoints";
import { useCallbackRef } from "@/components/hooks/use-callback-ref";

/**
 * Open state for SidebarProvider with the design's rules: the sidebar collapses on its own
 * when the viewport enters ≤1360px, a manual toggle (button or ⌘B) wins, and it reopens on
 * its own above 1360px only if it closed itself. Pass `open` to control it instead.
 */
export function useShellSidebarOpen(
  controlled: boolean | undefined,
  onChange: ((open: boolean) => void) | undefined,
) {
  const [inner, setInner] = React.useState(() => !matches(SHELL_MEDIA.sidebar));
  const closedItself = React.useRef(!inner);
  const notify = useCallbackRef(onChange);

  const set = React.useCallback(
    (next: boolean) => {
      setInner(next);
      notify(next);
    },
    [notify],
  );

  React.useEffect(() => {
    const mql = window.matchMedia(SHELL_MEDIA.sidebar);
    const onMedia = (event: MediaQueryListEvent) => {
      if (event.matches) {
        closedItself.current = true;
        set(false);
      } else if (closedItself.current) {
        closedItself.current = false;
        set(true);
      }
    };
    mql.addEventListener("change", onMedia);
    return () => mql.removeEventListener("change", onMedia);
  }, [set]);

  const onOpenChange = React.useCallback(
    (next: boolean) => {
      closedItself.current = false;
      set(next);
    },
    [set],
  );

  return { open: controlled ?? inner, onOpenChange };
}
