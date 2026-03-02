import type { ApiSchemas } from "@/lib/api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useElementScrollRestoration, useSearch } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { CalendarIcon } from "lucide-react";
import { useMemo, useRef } from "react";
import { useResizeObserver, useToggle } from "usehooks-ts";
import { eventQueries } from "../../api/queries";
import { EventsFilterSheet } from "../filters/filter-sheet";
import { EventCard } from "./event-card";
import { EventEmpty } from "./event-empty";
import { SavedToggle } from "./saved-toggle";

type Events = ApiSchemas["EventsResponse"][number]["events"];

type VirtualRow = { month: string; events: Events };

function getColumns(width: number) {
  if (width < 560) return 1;
  if (width < 640) return 2;
  return 3;
}

export function EventList() {
  const search = useSearch({ from: "/_app/(routes)/events/" });

  const { data } = useSuspenseQuery(eventQueries.events(search));
  const parentRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [showSaved, toggleShowSaved] = useToggle(false);

  const { width: containerWidth = 0 } = useResizeObserver({
    ref: parentRef as React.RefObject<HTMLDivElement>,
  });

  const measured = containerWidth > 0;
  const columns = getColumns(measured ? containerWidth : 0);

  const virtualRows = useMemo(() => {
    if (!data) return [];
    const allEvents = data.flatMap((category) =>
      category.events.map((event) => ({ month: category.month, event })),
    );
    const filteredEvents = showSaved
      ? allEvents.filter((event) => event.event.saved)
      : allEvents;
    const rows: VirtualRow[] = [];
    for (let i = 0; i < filteredEvents.length; i += columns) {
      const chunk = filteredEvents.slice(i, i + columns);
      rows.push({
        month: chunk[0].month,
        events: chunk.map((e) => e.event),
      });
    }
    return rows;
  }, [data, columns, showSaved]);

  const scrollEntry = useElementScrollRestoration({
    getElement: () => window,
  });

  // eslint-disable-next-line react-hooks/refs
  const rowVirtualizer = useWindowVirtualizer({
    count: virtualRows.length,
    estimateSize: () => 365,
    overscan: 3,
    gap: 8,
    // eslint-disable-next-line react-hooks/refs
    scrollMargin: listRef.current?.offsetTop ?? 0,
    initialOffset: scrollEntry?.scrollY,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const activeMonth =
    virtualItems.length > 0
      ? (virtualRows[virtualItems[0].index]?.month ?? "")
      : "";

  return (
    <div ref={parentRef}>
      <div className="sticky top-14 z-10 pb-3">
        <div className="flex items-center justify-between">
          <div className="border-brand/20 bg-background/90 flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-sm">
            <CalendarIcon className="text-brand size-3.5" />
            <span className="text-brand text-sm font-semibold">
              {activeMonth || "Empty"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SavedToggle onChange={toggleShowSaved} />
            <div className="bg-background rounded-lg">
              <EventsFilterSheet />
            </div>
          </div>
        </div>
      </div>

      {virtualRows.length === 0 ? (
        <EventEmpty />
      ) : (
        <div
          ref={listRef}
          style={{
            height: measured ? rowVirtualizer.getTotalSize() : undefined,
            position: "relative",
            visibility: measured ? undefined : "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${(virtualItems[0]?.start ?? 0) - rowVirtualizer.options.scrollMargin}px)`,
            }}
            className="flex flex-col gap-2"
          >
            {virtualItems.map((virtualItem) => {
              const row = virtualRows[virtualItem.index];

              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                >
                  {row.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
