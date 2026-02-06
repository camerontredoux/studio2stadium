import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { GraduationCapIcon } from "lucide-react";
import { useRef } from "react";
import { HiOutlineCalendar } from "react-icons/hi";
import { queries } from "../../api/queries";
import { SchoolCard } from "./school-card/school-card";
import { Spinner } from "@/components/ui/spinner";

export function SchoolList() {
  const navigate = useNavigate({ from: "/explore/" });

  const { name, ...search } = useSearch({ from: "/_app/(routes)/explore/" });
  const { data, isPlaceholderData } = useQuery(queries.schools(search));

  const rows =
    data?.filter((school) =>
      school.name
        .toLowerCase()
        .includes((name as string | undefined)?.toLowerCase() ?? ""),
    ) ?? [];

  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/refs
  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 128,
    gap: 8,
    // eslint-disable-next-line react-hooks/refs
    scrollMargin: parentRef.current?.offsetTop ?? 0,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  if (rows.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GraduationCapIcon />
          </EmptyMedia>
          <EmptyTitle>No schools found</EmptyTitle>
          <EmptyDescription>Try different search criteria.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => navigate({ to: "/explore" })}>
              Reset filters
            </Button>
            <Button size="sm" variant="outline" render={<Link to="/events" />}>
              <HiOutlineCalendar />
              View events
            </Button>
          </div>
        </EmptyContent>
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
          className="flex flex-col gap-2"
        >
          {isPlaceholderData && (
            <div className="absolute flex items-center justify-center z-10 w-full h-full">
              <Spinner />
            </div>
          )}
          {virtualItems.map((row) => {
            const school = rows[row.index];

            return (
              <div
                className={
                  isPlaceholderData
                    ? "blur-xs before:bg-black/20 before:inset-0 before:absolute before:z-10"
                    : ""
                }
                key={row.key}
                data-index={row.index}
                ref={rowVirtualizer.measureElement}
              >
                <SchoolCard school={school} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
