import { useLocation, useNavigate } from "@tanstack/react-router";
import { BookOpenIcon, PlayIcon } from "lucide-react";
import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Tabs, TabsList, TabsTab } from "../ui/tabs";

const resourceTabs = ["/resources/library", "/resources/blog"] as const;

export function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();

  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null,
  );

  const currentIndex = resourceTabs.indexOf(
    pathname as (typeof resourceTabs)[number],
  );

  function navigateTab(direction: "left" | "right") {
    const nextIndex =
      direction === "left" ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < resourceTabs.length) {
      setSlideDirection(direction);
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
        const targetIndex = resourceTabs.indexOf(
          value as (typeof resourceTabs)[number],
        );
        setSlideDirection(targetIndex > currentIndex ? "left" : "right");
        navigate({ to: value as string });
      }}
    >
      <TabsList
        variant="underline"
        className="**:data-[slot=tab-indicator]:bg-brand bg-background sticky top-12 z-50 -mt-2 w-full lg:-mt-4"
      >
        <TabsTab
          value="/resources/library"
          className="text-brand data-active:text-brand gap-1.5 text-sm sm:text-xs"
        >
          <PlayIcon className="size-3.5" />
          Tap In
        </TabsTab>
        <TabsTab
          value="/resources/blog"
          className="text-brand data-active:text-brand gap-1.5 text-sm sm:text-xs"
        >
          <BookOpenIcon className="size-3.5" />
          Blog
        </TabsTab>
      </TabsList>
      <div {...handlers} className="overflow-x-clip">
        <div
          key={pathname}
          className="animate-slide-in"
          style={{
            ["--slide-from" as string]:
              slideDirection === "left" ? "30%" : "-30%",
          }}
          onAnimationEnd={() => setSlideDirection(null)}
        >
          {children}
        </div>
      </div>
    </Tabs>
  );
}
