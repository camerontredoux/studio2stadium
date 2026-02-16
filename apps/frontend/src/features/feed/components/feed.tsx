import { useSuspenseQuery } from "@tanstack/react-query";
import { useElementScrollRestoration } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { feedQueries } from "../api/queries";
import { FeedItem } from "./feed-item";

export function Feed() {
  const { data } = useSuspenseQuery(feedQueries.feed());

  const scrollEntry = useElementScrollRestoration({
    getElement: () => window,
  });

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/refs
  const rowVirtualizer = useWindowVirtualizer({
    count: data.length,
    estimateSize: () => 450,
    gap: 8,
    overscan: 2,
    // eslint-disable-next-line react-hooks/refs
    scrollMargin: parentRef.current?.offsetTop ?? 0,
    initialOffset: scrollEntry?.scrollY,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="sm:pb-6 lg:pb-8">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
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
          className="flex flex-col gap-2 overflow-clip rounded-2xl lg:gap-4"
        >
          {virtualItems.map((row) => (
            <div
              key={row.key}
              data-index={row.index}
              ref={rowVirtualizer.measureElement}
            >
              <FeedItem item={data[row.index]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
