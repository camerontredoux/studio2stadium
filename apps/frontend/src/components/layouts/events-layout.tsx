import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useSwipeable } from "react-swipeable";
import { Tabs, TabsList, TabsTab } from "../ui/tabs";

const eventTabs = ["/events/schools", "/events/global"] as const;

export function EventsLayout({ children }: { children: React.ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();

  const currentIndex = eventTabs.indexOf(
    pathname as (typeof eventTabs)[number],
  );

  function navigateTab(direction: "left" | "right") {
    const nextIndex =
      direction === "left" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < eventTabs.length) {
      navigate({ to: eventTabs[nextIndex] });
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
          value="/events/schools"
          className="text-brand data-active:text-brand max-sm:text-sm"
          render={<Link to="/events/schools" />}
        >
          Schools
        </TabsTab>
        <TabsTab
          nativeButton={false}
          value="/events/global"
          className="text-brand data-active:text-brand max-sm:text-sm"
          render={<Link to="/events/global" />}
        >
          Global
        </TabsTab>
      </TabsList>
      <div {...handlers} className="overflow-x-clip">
        {children}
      </div>
    </Tabs>
  );
}
