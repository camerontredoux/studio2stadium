import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { BellOffIcon, XIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { notificationQueries } from "../api/queries";
import { NotificationItem } from "./notification-item";

export function NotificationList() {
  const { status, data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(notificationQueries.notifications());

  const notifications = data?.pages.flatMap((page) => page.data ?? []) ?? [];

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/refs
  const rowVirtualizer = useWindowVirtualizer({
    count: hasNextPage ? notifications.length + 1 : notifications.length,
    estimateSize: () => 72,
    overscan: 5,
    // eslint-disable-next-line react-hooks/refs
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= notifications.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    notifications.length,
    isFetchingNextPage,
    virtualItems,
  ]);

  if (status === "pending") {
    return <NotificationListSkeleton />;
  }

  if (status === "error") {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="border-destructive-foreground">
            <XIcon className="text-destructive-foreground size-6" />
          </EmptyMedia>
          <EmptyTitle>Error loading notifications</EmptyTitle>
          <EmptyDescription>Try refreshing the page.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (notifications.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BellOffIcon className="size-6" />
          </EmptyMedia>
          <EmptyTitle>No notifications yet</EmptyTitle>
          <EmptyDescription>
            When something happens, you'll see it here
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div ref={parentRef}>
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
          className="flex flex-col divide-y"
        >
          {virtualItems.map((row) => {
            const isLoaderRow = row.index > notifications.length - 1;
            const notification = notifications[row.index];

            return (
              <div
                key={row.key}
                data-index={row.index}
                ref={rowVirtualizer.measureElement}
              >
                {isLoaderRow ? (
                  <NotificationItemSkeleton />
                ) : (
                  <NotificationItem notification={notification} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NotificationItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-2 py-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function NotificationListSkeleton() {
  return (
    <div className="flex flex-col divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </div>
  );
}
