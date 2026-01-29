import type { ReactNode } from "react";
import { SidebarWrapper } from "../shared/sidebar-wrapper";

interface SidebarLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export function SidebarLayout({ children, sidebar }: SidebarLayoutProps) {
  return (
    <div className="flex gap-2 lg:gap-4">
      <div className="w-full">{children}</div>
      <SidebarWrapper>{sidebar}</SidebarWrapper>
    </div>
  );
}
