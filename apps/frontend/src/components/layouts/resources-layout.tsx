import { useSession } from "@/lib/session";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useSwipeable } from "react-swipeable";
import { Tabs, TabsList, TabsTab } from "../ui/tabs";

export function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();

  const resourceTabs = [
    session.type === "dancer" ? "/resources/library" : "/resources/favorites",
    "/resources/blog",
  ] as const;

  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();

  const currentIndex = resourceTabs.indexOf(
    pathname as (typeof resourceTabs)[number],
  );

  function navigateTab(direction: "left" | "right") {
    const nextIndex =
      direction === "left" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < resourceTabs.length) {
      navigate({ to: resourceTabs[nextIndex] });
    }
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => navigateTab("left"),
    onSwipedRight: () => navigateTab("right"),
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  return (
    <Tabs className="mobile:pb-14" value={pathname}>
      <TabsList
        variant="underline"
        className="**:data-[slot=tab-indicator]:bg-brand bg-background sticky top-12 z-50 -mt-2 w-full lg:-mt-4"
      >
        <TabsTab
          nativeButton={false}
          value={resourceTabs[0]}
          className="text-brand data-active:text-brand max-sm:text-sm"
          render={<Link to={resourceTabs[0]} />}
        >
          {session.type === "dancer" ? "Tap In" : "Favorites"}
        </TabsTab>
        <TabsTab
          nativeButton={false}
          value={resourceTabs[1]}
          className="text-brand data-active:text-brand max-sm:text-sm"
          render={<Link to={resourceTabs[1]} />}
        >
          Blog
        </TabsTab>
      </TabsList>
      <div {...handlers} className="overflow-x-clip">
        {children}
      </div>
    </Tabs>
  );
}
