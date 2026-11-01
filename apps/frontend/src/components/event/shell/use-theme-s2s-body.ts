import { useEffect } from "react";

// Counted so two shells mounted during a route transition don't strip the class early.
let mounted = 0;

/**
 * Adds `theme-s2s` to <body> while a dashboard is mounted, so Base UI popups (portalled
 * to body) pick up the S2S tokens and fonts. Removes it on unmount.
 */
export function useThemeS2sBody(): void {
  useEffect(() => {
    mounted += 1;
    document.body.classList.add("theme-s2s");
    return () => {
      mounted -= 1;
      if (mounted === 0) document.body.classList.remove("theme-s2s");
    };
  }, []);
}
