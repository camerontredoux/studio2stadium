import { queries } from "@/shared/engagement/api/queries";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { exploreQueries } from "../../api/queries";
import { ListError } from "../list-error";
import { DancerCard } from "./dancer-card";
import { DancerEmpty } from "./dancer-empty";
import { DancerPagination } from "./dancer-pagination";
import { DancerListSkeleton } from "./dancer-skeleton";

export function DancerList() {
  const search = useSearch({ from: "/_app/(routes)/dancers" });

  const { data, isPending, isPlaceholderData, refetch } = useQuery(
    exploreQueries.dancers(search),
  );

  const { data: following, isError: followingFailed } = useQuery(
    queries.followingIds("school"),
  );

  const rows = data?.dancers ?? [];

  if (isPending) {
    return <DancerListSkeleton />;
  }

  if (!data) {
    return (
      <ListError title="Error loading dancers" onRetry={() => refetch()} />
    );
  }

  if (rows.length === 0) {
    return <DancerEmpty />;
  }

  return (
    <div className="space-y-4">
      <DancerPagination pagination={data.pagination} />
      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          // Without the ids, show no badge rather than a skeleton forever.
          const isFollowing = followingFailed
            ? false
            : following?.some((id) => id === row.id);

          return (
            <div
              className={
                isPlaceholderData
                  ? "blur-xs before:absolute before:inset-0 before:z-10 before:bg-black/20"
                  : ""
              }
              key={row.id}
            >
              <DancerCard dancer={row} isFollowing={isFollowing} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
