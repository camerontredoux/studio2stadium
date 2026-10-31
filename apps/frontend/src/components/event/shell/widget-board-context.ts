import * as React from "react";

type WidgetBoardContextValue = {
  order: readonly string[];
  openId: string | null;
  /** True while the board's tracks animate after an open or close. */
  animating: boolean;
  setOpen: (id: string | null) => void;
};

export const WidgetBoardContext =
  React.createContext<WidgetBoardContextValue | null>(null);

/** For `Tile`: its place and state on the surrounding board, or null outside a board. */
export function useWidgetBoardSlot(id: string) {
  const ctx = React.useContext(WidgetBoardContext);
  if (!ctx) return null;
  const index = ctx.order.indexOf(id);
  const state: WidgetState =
    ctx.openId === null ? "peek" : ctx.openId === id ? "open" : "strip";
  return {
    index,
    state,
    animating: ctx.animating,
    open: () => ctx.setOpen(id),
    collapse: () => ctx.setOpen(null),
  };
}

export type WidgetState = "peek" | "strip" | "open";
