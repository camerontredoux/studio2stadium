import { createContext, useContext } from "react";

export interface ShellSlotsContextValue {
  /** Where a page's header renders (inside the shell's content column). */
  headerEl: HTMLElement | null;
  /** Where a page's rail renders (beside the main column); null until a page asks for one. */
  railEl: HTMLElement | null;
  /** Marks that a page supplies its own header; returns the cleanup. */
  registerHeader: () => () => void;
  /** Marks that a page shows the rail; returns the cleanup. */
  registerRail: () => () => void;
}

export const ShellSlotsContext = createContext<ShellSlotsContextValue | null>(
  null,
);

export function useShellSlots() {
  return useContext(ShellSlotsContext);
}
