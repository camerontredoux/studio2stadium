import { useEffect, useState, type ReactNode } from "react";
import { SidebarWrapper } from "../shared/sidebar-wrapper";
import { Tabs, TabsList, TabsPanel, TabsTab } from "../ui/tabs";

interface SidebarLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  tabs?: {
    contentLabel: string;
    sidebarLabel: string;
  };
}

const LG_BREAKPOINT = 1024;

function useCollapsedSidebar() {
  const [below, setBelow] = useState(
    () => window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setBelow(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return below;
}

export function SidebarLayout({ children, sidebar, tabs }: SidebarLayoutProps) {
  const collapsed = useCollapsedSidebar();

  if (tabs && collapsed) {
    return (
      <Tabs defaultValue="content">
        <TabsList
          variant="underline"
          className="**:data-[slot=tab-indicator]:bg-brand bg-background sticky top-12 z-50 -mt-2 w-full"
        >
          <TabsTab
            className="text-brand data-active:text-brand gap-1.5 text-sm"
            value="content"
          >
            {tabs.contentLabel}
          </TabsTab>
          <TabsTab
            className="text-brand data-active:text-brand gap-1.5 text-sm"
            value="sidebar"
          >
            {tabs.sidebarLabel}
          </TabsTab>
        </TabsList>
        <TabsPanel className="mobile:pb-16 mt-2" value="content">
          {children}
        </TabsPanel>
        <TabsPanel className="mobile:pb-16 mt-2" value="sidebar">
          <div className="space-y-2">{sidebar}</div>
        </TabsPanel>
      </Tabs>
    );
  }

  return (
    <div className="flex gap-2 lg:gap-4">
      <div className="w-full">{children}</div>
      <SidebarWrapper>{sidebar}</SidebarWrapper>
    </div>
  );
}
