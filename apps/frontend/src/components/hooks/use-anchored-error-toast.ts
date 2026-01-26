import { useRef } from "react";
import { anchoredToastManager } from "../ui/toast-manager";

type AnchoredErrorToastOptions = {
  title?: string;
  timeout?: number;
};

export function useAnchoredErrorToast(
  anchorRef: React.RefObject<HTMLElement | null>,
  options: AnchoredErrorToastOptions = {},
) {
  const { title = "Error", timeout = 3000 } = options;
  const toastIdRef = useRef<string | null>(null);

  const show = (message: string) => {
    if (toastIdRef.current) {
      anchoredToastManager.close(toastIdRef.current);
      toastIdRef.current = null;
    }

    toastIdRef.current = anchoredToastManager.add({
      title,
      description: message,
      type: "error",
      timeout,
      positionerProps: {
        anchor: anchorRef.current,
        sideOffset: 8,
      },
    });
  };

  const close = () => {
    if (toastIdRef.current) {
      anchoredToastManager.close(toastIdRef.current);
      toastIdRef.current = null;
    }
  };

  return { show, close };
}
