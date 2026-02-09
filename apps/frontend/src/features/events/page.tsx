import { Tabs, TabsContent, TabsList, TabsTab } from "@/components/ui/tabs";
import { Suspense, useState } from "react";
import { flushSync } from "react-dom";
import { useSwipeable } from "react-swipeable";
import { EventList } from "./components/events/event-list";
import { EventListSkeleton } from "./components/events/event-skeleton";
import { GlobalEventList } from "./components/global-events/global-event-list";
import { GlobalEventListSkeleton } from "./components/global-events/global-event-skeleton";

const eventTabs = ["local", "global"] as const;

export function Page() {
  const [activeTab, setActiveTab] =
    useState<(typeof eventTabs)[number]>("local");

  const currentIndex = eventTabs.indexOf(activeTab);

  const changeTab = (tab: (typeof eventTabs)[number]) => {
    flushSync(() => {
      setActiveTab(tab);
    });
    window.scrollTo(0, 0);
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const next = currentIndex + 1;
      if (next < eventTabs.length) changeTab(eventTabs[next]);
    },
    onSwipedRight: () => {
      const next = currentIndex - 1;
      if (next >= 0) changeTab(eventTabs[next]);
    },
    preventScrollOnSwipe: true,
    trackTouch: true,
  });

  return (
    <div className="mobile:pb-14 flex flex-col gap-2 pt-1 sm:pt-0">
      <Tabs
        value={activeTab}
        onValueChange={(v) => changeTab(v as (typeof eventTabs)[number])}
      >
        <TabsList
          variant="underline"
          className="**:data-[slot=tab-indicator]:bg-brand bg-background sticky top-12 z-50 -mt-4 w-full"
        >
          <TabsTab
            value="local"
            className="text-brand data-active:text-brand max-sm:text-sm"
          >
            Schools
          </TabsTab>
          <TabsTab
            value="global"
            className="text-brand data-active:text-brand max-sm:text-sm"
          >
            Global
          </TabsTab>
        </TabsList>

        <div className="mt-6 mb-2 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-col max-sm:pl-1">
            <h1 className="text-2xl leading-none font-bold tracking-tight">
              Events
            </h1>
            <p className="text-muted-foreground text-sm">
              Showcases, auditions, workshops & more
            </p>
          </div>
        </div>

        <div {...handlers} className="overflow-x-clip">
          <TabsContent value="local">
            <Suspense fallback={<EventListSkeleton />}>
              <EventList />
            </Suspense>
          </TabsContent>

          <TabsContent value="global">
            <Suspense fallback={<GlobalEventListSkeleton />}>
              <GlobalEventList />
            </Suspense>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
