import { useLocation, useNavigate } from "@tanstack/react-router";
import { useSwipeable } from "react-swipeable";
import { Tabs, TabsList, TabsTab } from "../ui/tabs";

const resourceTabs = ["/resources/library", "/resources/blog"] as const;

export function ResourcesLayout({ children }: { children: React.ReactNode }) {
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
    <Tabs
      className="mobile:pb-14"
      value={pathname}
      onValueChange={(value) => {
        navigate({ to: value as string });
      }}
    >
      <TabsList
        variant="underline"
        className="**:data-[slot=tab-indicator]:bg-brand bg-background sticky top-12 z-50 -mt-2 w-full lg:-mt-4"
      >
        <TabsTab
          value="/resources/library"
          className="text-brand data-active:text-brand max-sm:text-sm"
        >
          Tap In
        </TabsTab>
        <TabsTab
          value="/resources/blog"
          className="text-brand data-active:text-brand max-sm:text-sm"
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
