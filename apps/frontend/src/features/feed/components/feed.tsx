import { useInfiniteQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { feedQueries } from "../api/queries";
import { FeedItem } from "./content/feed-item";
import { FeedItemSkeleton, FeedSkeleton } from "./feed-skeleton";

export function Feed() {
  const { status, data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(feedQueries.feed());

  const rows = data ? data.pages.flatMap((page) => page.feed) : [];

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/refs
  const rowVirtualizer = useWindowVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    estimateSize: () => 450,
    gap: 8,
    overscan: 2,
    // eslint-disable-next-line react-hooks/refs
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, rows.length, isFetchingNextPage, virtualItems]);

  if (status === "pending") {
    return <FeedSkeleton />;
  }

  if (status === "error") {
    return <div>Error loading feed</div>;
  }

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
          {virtualItems.map((row) => {
            const isLoaderRow = row.index > rows.length - 1;
            const item = rows[row.index];

            return (
              <div
                key={row.key}
                data-index={row.index}
                ref={rowVirtualizer.measureElement}
              >
                {isLoaderRow ? <FeedItemSkeleton /> : <FeedItem item={item} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
