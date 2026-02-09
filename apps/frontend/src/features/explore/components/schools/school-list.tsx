import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { queries } from "../../api/queries";
import { useVirtualizer } from "../hooks/use-virtualizer";
import { SchoolCard } from "./school-card/school-card";
import { SchoolEmpty } from "./school-empty";
import { SchoolListSkeleton } from "./school-skeleton";

export function SchoolList() {
  const { name, ...search } = useSearch({ from: "/_app/(routes)/explore/" });
  const { data, isPending, isPlaceholderData } = useQuery(
    queries.schools(search),
  );

  const rows =
    data?.filter((school) =>
      school.name
        .toLowerCase()
        .includes((name as string | undefined)?.toLowerCase() ?? ""),
    ) ?? [];

  const { parentRef, rowVirtualizer, virtualItems } = useVirtualizer({ rows });

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

            if (!school.user?.username) {
              return null;
            }

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
                <SchoolCard school={school} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
