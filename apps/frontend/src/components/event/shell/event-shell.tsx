import type * as React from "react";

import { useShellSidebarOpen } from "@/components/event/shell/use-shell-sidebar-open";
import { useThemeS2sBody } from "@/components/event/shell/use-theme-s2s-body";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/components/utils/cn";

const SIDEBAR_WIDTHS = {
  "--sidebar-width": "var(--sidebar-w)",
  "--sidebar-width-icon": "var(--sidebar-collapsed)",
} as React.CSSProperties;

type EventShellProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** A `ShellSidebar` (components/ui Sidebar). Shown above 800px. */
  sidebar: React.ReactNode;
  /** The event switcher for the phone brand row (≤800px), usually the same trigger as the sidebar's brand. */
  phoneBrand?: React.ReactNode;
  /** A `ShellHeader` (or `PageHeader`). */
  header: React.ReactNode;
  /** A `ShellRail`. Omit it for full-width pages (rosters, audit log). */
  rail?: React.ReactNode;
  /** A `PhoneDock`, shown only at 800px and below. */
  dock?: React.ReactNode;
  /** Controlled sidebar state. Leave unset for the auto-collapse rules. */
  sidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  /** The main column: usually a `WidgetBoard`, then panels. */
  children: React.ReactNode;
};

/**
 * The S2S dashboard frame shared by the admin, coach and dancer views. Its root is the
 * components/ui SidebarProvider (232px / 56px, auto-collapsing at ≤1360px), then the
 * header, a body grid of main column + right rail, and the phone dock. Scopes the S2S
 * theme to its subtree and to <body> (for portals). It fetches nothing.
 */
function EventShell({
  sidebar,
  phoneBrand,
  header,
  rail,
  dock,
  sidebarOpen,
  onSidebarOpenChange,
  children,
  className,
  style,
  ...props
}: EventShellProps) {
  useThemeS2sBody();
  const { open, onOpenChange } = useShellSidebarOpen(
    sidebarOpen,
    onSidebarOpenChange,
  );
  return (
    <SidebarProvider
      open={open}
      onOpenChange={onOpenChange}
      className={cn("theme-s2s s2s-shell font-sans", className)}
      style={{ ...SIDEBAR_WIDTHS, ...style }}
      {...props}
    >
      {phoneBrand !== undefined && (
        <div className="s2s-phone-top">{phoneBrand}</div>
      )}
      {sidebar}
      <div className="s2s-content">
        {header}
        <div className="s2s-body" data-full={rail ? undefined : ""}>
          <main className="s2s-main">{children}</main>
          {rail}
        </div>
      </div>
      {dock}
    </SidebarProvider>
  );
}

export { EventShell };
export type { EventShellProps };
