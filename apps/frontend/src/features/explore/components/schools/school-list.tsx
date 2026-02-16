import { Spinner } from "@/components/ui/spinner";
import { queries } from "@/shared/api/queries";
import { useQuery } from "@tanstack/react-query";
import { useElementScrollRestoration, useSearch } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useDeferredValue, useRef } from "react";
import { exploreQueries } from "../../api/queries";
import { SchoolCard } from "./school-card/school-card";
import { SchoolEmpty } from "./school-empty";
import { SchoolListSkeleton } from "./school-skeleton";

export function SchoolList() {
  const { name, ...search } = useSearch({ from: "/_app/(routes)/explore/" });

  const { data, isPending, isPlaceholderData } = useQuery(
    exploreQueries.schools(search),
  );

  const { data: following } = useQuery(queries.followingIds());

  const deferredName = useDeferredValue(name as string | undefined);

  const needle = deferredName?.toLowerCase() ?? "";
  const rows =
    data?.filter((school) => school.name.toLowerCase().includes(needle)) ?? [];

  const scrollEntry = useElementScrollRestoration({
    getElement: () => window,
  });

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/refs
  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 100,
    gap: 8,
    overscan: 3,
    // eslint-disable-next-line react-hooks/refs
    scrollMargin: parentRef.current?.offsetTop ?? 0,
    initialOffset: scrollEntry?.scrollY,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  if (isPending) {
    return <SchoolListSkeleton />;
  }

  if (rows.length === 0) {
    return <SchoolEmpty />;
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
          {isPlaceholderData && (
            <div className="absolute z-10 flex h-full w-full items-center justify-center">
              <Spinner />
            </div>
          )}
          {virtualItems.map((row) => {
            const school = rows[row.index];

            const isFollowing = following?.some((id) => id === school.id);

            return (
              <div
                className={
                  isPlaceholderData
                    ? "blur-xs before:absolute before:inset-0 before:z-10 before:bg-black/20"
                    : ""
                }
                key={row.key}
                data-index={row.index}
                ref={rowVirtualizer.measureElement}
              >
                <SchoolCard school={school} isFollowing={isFollowing} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
