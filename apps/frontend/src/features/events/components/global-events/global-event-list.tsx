import type { ApiSchemas } from "@/lib/api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";
import { useResizeObserver } from "usehooks-ts";
import { queries } from "../../api/queries";
import { GlobalEventCard } from "./global-event-card";

type Events = ApiSchemas["EventsGlobalResponse"];

function getColumns(width: number) {
  if (width < 560) return 1;
  if (width < 640) return 2;
  return 3;
}

export function GlobalEventList() {
  const { data } = useSuspenseQuery(queries.globalEvents());
  const parentRef = useRef<HTMLDivElement>(null);

  const { width: containerWidth = 0 } = useResizeObserver({
    ref: parentRef as React.RefObject<HTMLDivElement>,
  });

  const measured = containerWidth > 0;
  const columns = getColumns(measured ? containerWidth : 0);

  const virtualRows = useMemo(() => {
    const rows: Events[] = [];
    for (let i = 0; i < data.length; i += columns) {
      const chunk = data.slice(i, i + columns);
      rows.push(chunk);
    }
    return rows;
  }, [data, columns]);

  // eslint-disable-next-line react-hooks/refs
  const rowVirtualizer = useWindowVirtualizer({
    count: virtualRows.length,
    estimateSize: () => 365,
    overscan: 3,
    gap: 8,
    // eslint-disable-next-line react-hooks/refs
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div ref={parentRef}>
      <div
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
                {row.map((event) => (
                  <GlobalEventCard key={event.id} event={event} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
