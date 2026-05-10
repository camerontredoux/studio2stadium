/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AdminCommandAction =
  | { type: "open-upload"; kind: "dancer" | "coach" }
  | { type: "open-edit-event" };

type ActionListener = (action: AdminCommandAction) => void;

interface AdminCommandsContextValue {
  paletteOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
  /** Synchronously dispatches an action to all subscribers and closes palette. */
  dispatch: (action: AdminCommandAction) => void;
  /** Subscribe to actions. Returns an unsubscribe fn. */
  subscribe: (listener: ActionListener) => () => void;
}

const AdminCommandsContext = createContext<AdminCommandsContextValue | null>(
  null,
);

export function AdminCommandsProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const listenersRef = useRef<Set<ActionListener>>(new Set());

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  const dispatch = useCallback((action: AdminCommandAction) => {
    // Close palette first, then notify listeners synchronously. Listeners
    // can safely call setState here because this runs in response to a
    // user event (click / keypress), not inside a React effect body.
    setPaletteOpen(false);
    listenersRef.current.forEach((listener) => listener(action));
  }, []);

  const subscribe = useCallback((listener: ActionListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo<AdminCommandsContextValue>(
    () => ({
      paletteOpen,
      openPalette,
      closePalette,
      dispatch,
      subscribe,
    }),
    [paletteOpen, openPalette, closePalette, dispatch, subscribe],
  );

  return (
    <AdminCommandsContext.Provider value={value}>
      {children}
    </AdminCommandsContext.Provider>
  );
}

export function useAdminCommands(): AdminCommandsContextValue {
  const ctx = useContext(AdminCommandsContext);
  if (!ctx) {
    throw new Error(
      "useAdminCommands must be used inside AdminCommandsProvider",
    );
  }
  return ctx;
}

/** Subscribe to a subset of actions. Handler identity doesn't need to be stable. */
export function useAdminCommandListener(
  match: (action: AdminCommandAction) => boolean,
  handler: (action: AdminCommandAction) => void,
) {
  const { subscribe } = useAdminCommands();
  const matchRef = useRef(match);
  const handlerRef = useRef(handler);

  // Keep refs in sync with latest props without reading/writing during render.
  useEffect(() => {
    matchRef.current = match;
    handlerRef.current = handler;
  });

  useEffect(() => {
    return subscribe((action) => {
      if (matchRef.current(action)) handlerRef.current(action);
    });
  }, [subscribe]);
}
