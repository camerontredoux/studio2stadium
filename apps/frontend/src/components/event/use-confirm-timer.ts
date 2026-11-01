import * as React from "react";

/** How long a picked value stays visible before a picker moves on or closes. */
const CONFIRM_MS = 160;

/** A timer for the short pause after a pick; cleared on unmount or when replaced. */
function useConfirmTimer() {
  const timer = React.useRef<number | undefined>(undefined);
  const clear = React.useCallback(() => window.clearTimeout(timer.current), []);
  const after = React.useCallback(
    (run: () => void) => {
      clear();
      timer.current = window.setTimeout(run, CONFIRM_MS);
    },
    [clear],
  );
  React.useEffect(() => clear, [clear]);
  return { after, clear };
}

export { CONFIRM_MS, useConfirmTimer };
