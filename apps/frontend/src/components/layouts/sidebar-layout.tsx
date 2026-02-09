import { useEffect, useState, type ReactNode } from "react";
import { useSwipeable } from "react-swipeable";
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

const sidebarTabs = ["content", "sidebar"] as const;

export function SidebarLayout({ children, sidebar, tabs }: SidebarLayoutProps) {
  const collapsed = useCollapsedSidebar();
  const [activeTab, setActiveTab] =
    useState<(typeof sidebarTabs)[number]>("content");

  const currentIndex = sidebarTabs.indexOf(activeTab);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const next = currentIndex + 1;
      if (next < sidebarTabs.length) setActiveTab(sidebarTabs[next]);
    },
    onSwipedRight: () => {
      const next = currentIndex - 1;
      if (next >= 0) setActiveTab(sidebarTabs[next]);
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  if (tabs && collapsed) {
    return (
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as (typeof sidebarTabs)[number])}
      >
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
        <div {...handlers} className="mt-4 overflow-x-clip">
          <TabsPanel className="mobile:pb-16" value="content">
            {children}
          </TabsPanel>
          <TabsPanel className="mobile:pb-16" value="sidebar">
            <div className="space-y-2">{sidebar}</div>
          </TabsPanel>
        </div>
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
