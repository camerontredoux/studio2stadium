import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useSession } from "@/lib/session";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { GraduationCapIcon, XIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { feedQueries } from "../api/queries";
import { FeedItem } from "./content/feed-item";
import { FeedItemSkeleton, FeedSkeleton } from "./feed-skeleton";

export function Feed() {
  const session = useSession();

  const { status, data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(feedQueries.feed());

  const rows = data ? data.pages.flatMap((page) => page.feed) : [];

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/refs
  const rowVirtualizer = useWindowVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    estimateSize: () => 740,
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
  }, [
    hasNextPage,
    fetchNextPage,
    rows.length,
    isFetchingNextPage,
    virtualItems,
  ]);

  if (status === "pending") {
    return <FeedSkeleton />;
  }

  if (status === "error") {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="border-destructive-foreground">
            <XIcon className="text-destructive-foreground size-6" />
          </EmptyMedia>
          <EmptyTitle>Error loading feed</EmptyTitle>
          <EmptyDescription>Try refreshing the page.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (rows.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="border-brand">
            <GraduationCapIcon className="text-brand size-6" />
          </EmptyMedia>
          <EmptyTitle>No feed items</EmptyTitle>
          <EmptyDescription>
            Try following more accounts to see their latest content.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
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
                {isLoaderRow ? (
                  <FeedItemSkeleton />
                ) : (
                  <FeedItem type={session.type} item={item} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
