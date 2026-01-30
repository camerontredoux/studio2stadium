import { Link, useLocation } from "@tanstack/react-router";
import { BookOpenIcon, PlayIcon } from "lucide-react";
import { Tabs, TabsList, TabsTab } from "../ui/tabs";

export function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <Tabs className="mobile:pb-14" defaultValue={pathname}>
      <TabsList
        variant="underline"
        className="**:data-[slot=tab-indicator]:bg-brand sticky top-12 z-50 bg-background w-full"
      >
        <TabsTab
          value="/resources/library"
          className="gap-1.5 text-sm sm:text-xs text-brand data-active:text-brand"
          render={<Link to="/resources/library" />}
        >
          <PlayIcon className="size-3.5" />
          Tap In
        </TabsTab>
        <TabsTab
          value="/resources/blog"
          className="gap-1.5 text-sm sm:text-xs text-brand data-active:text-brand"
          render={<Link to="/resources/blog" />}
        >
          <BookOpenIcon className="size-3.5" />
          Blog
        </TabsTab>
      </TabsList>
      {children}
    </Tabs>
  );
}
