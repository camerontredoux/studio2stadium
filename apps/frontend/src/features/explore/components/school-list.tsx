import { $api } from "@/lib/api/client";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { SchoolCard } from "./school-card/school-card";

export function SchoolList() {
  const { status, data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    $api.useInfiniteQuery(
      "get",
      "/schools",
      {},
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined,
      },
    );

  const rows = data ? data.pages.flatMap((page) => page.schools) : [];

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/refs
  const rowVirtualizer = useWindowVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    estimateSize: () => 128,
    gap: 8,
    overscan: 3,
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
    return "Loading...";
  }

  if (status === "error") {
    return "Error loading schools";
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
          className="flex flex-col gap-2"
        >
          {virtualItems.map((row) => {
            const isLoaderRow = row.index > rows.length - 1;
            const school = rows[row.index];

            return (
              <div
                key={row.key}
                data-index={row.index}
                ref={rowVirtualizer.measureElement}
              >
                <SchoolCard school={school} isLoaderRow={isLoaderRow} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
