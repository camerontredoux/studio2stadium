import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { PageHeaderEndContext } from "@/components/event/page-header";
import { EventShell, type EventShellProps } from "@/components/event/shell";
import { ViewSwitcher } from "@/features/org/components/view-switcher";

import {
  ShellSlotsContext,
  useShellSlots,
  type ShellSlotsContextValue,
} from "./shell-slots-context";

type AreaShellFrameProps = Omit<EventShellProps, "header" | "rail"> & {
  /** Shown until a page renders its own header through `ShellPage`. */
  fallbackHeader: ReactNode;
  /** The admin "viewing as" indicator, shown at the start of the header (desktop) and the phone brand row. */
  viewAs?: (placement: "header" | "phone") => ReactNode;
};

/**
 * The area layouts' `EventShell`. Pages under it pick their own header and
 * rail with `ShellPage`, which portals them into the shell's slots, so the
 * layout keeps one shell (sidebar state, theme) across navigations.
 */
export function AreaShellFrame({
  fallbackHeader,
  viewAs,
  phoneBrand,
  children,
  ...props
}: AreaShellFrameProps) {
  const [headerEl, setHeaderEl] = useState<HTMLElement | null>(null);
  const [railEl, setRailEl] = useState<HTMLElement | null>(null);
  const [headerCount, setHeaderCount] = useState(0);
  const [railCount, setRailCount] = useState(0);

  const registerHeader = useCallback(() => {
    setHeaderCount((count) => count + 1);
    return () => setHeaderCount((count) => count - 1);
  }, []);
  const registerRail = useCallback(() => {
    setRailCount((count) => count + 1);
    return () => setRailCount((count) => count - 1);
  }, []);

  const value = useMemo<ShellSlotsContextValue>(
    () => ({
      headerEl,
      railEl: railCount > 0 ? railEl : null,
      registerHeader,
      registerRail,
    }),
    [headerEl, railEl, railCount, registerHeader, registerRail],
  );

  return (
    <ShellSlotsContext.Provider value={value}>
      <PageHeaderEndContext.Provider value={viewAs?.("header") ?? null}>
        <EventShell
          {...props}
          // Phones hide the sidebar, so its person menu (View as, Profile,
          // theme, Log out) opens from an avatar at the end of the brand row.
          phoneBrand={
            phoneBrand !== undefined ? (
              <>
                {phoneBrand}
                {viewAs?.("phone")}
                <ViewSwitcher variant="phone" />
              </>
            ) : undefined
          }
          header={
            <>
              {headerCount === 0 && fallbackHeader}
              <div ref={setHeaderEl} className="contents" />
            </>
          }
          rail={
            railCount > 0 ? (
              <div ref={setRailEl} className="contents" />
            ) : undefined
          }
        >
          {children}
        </EventShell>
      </PageHeaderEndContext.Provider>
    </ShellSlotsContext.Provider>
  );
}

export interface ShellPageProps {
  /** The page header: `EventDashboardHeader`, `SubpageHeader` or a `ShellHeader`. */
  header?: ReactNode;
  /** The right rail (dashboards only), e.g. `<EventRail event={…} />`. Omit for full-width pages. */
  rail?: ReactNode;
  /** The main column content. */
  children?: ReactNode;
}

/**
 * Wrap a page under an area layout in this to set the shell's header and
 * rail. Outside an area layout it renders the header and content in place.
 */
export function ShellPage({ header, rail, children }: ShellPageProps) {
  const slots = useShellSlots();
  const hasHeader = header != null;
  const hasRail = rail != null;
  const registerHeader = slots?.registerHeader;
  const registerRail = slots?.registerRail;

  useLayoutEffect(() => {
    if (!registerHeader || !hasHeader) return;
    return registerHeader();
  }, [registerHeader, hasHeader]);
  useLayoutEffect(() => {
    if (!registerRail || !hasRail) return;
    return registerRail();
  }, [registerRail, hasRail]);

  if (!slots) {
    return (
      <>
        {header}
        {children}
        {rail}
      </>
    );
  }

  return (
    <>
      {hasHeader && slots.headerEl && createPortal(header, slots.headerEl)}
      {children}
      {hasRail && slots.railEl && createPortal(rail, slots.railEl)}
    </>
  );
}
