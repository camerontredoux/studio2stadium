import { Link, useLocation } from "@tanstack/react-router";
import { BookOpenIcon, PlayIcon } from "lucide-react";
import { Tabs, TabsList, TabsTab } from "../ui/tabs";

export function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });

  return (
    <Tabs className="mobile:pb-14" defaultValue={pathname}>
      <TabsList
        variant="underline"
        className="**:data-[slot=tab-indicator]:bg-brand bg-background sticky top-12 z-50 -mt-2 w-full lg:-mt-4"
      >
        <TabsTab
          value="/resources/library"
          className="text-brand data-active:text-brand gap-1.5 text-sm sm:text-xs"
          render={<Link to="/resources/library" />}
        >
          <PlayIcon className="size-3.5" />
          Tap In
        </TabsTab>
        <TabsTab
          value="/resources/blog"
          className="text-brand data-active:text-brand gap-1.5 text-sm sm:text-xs"
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
