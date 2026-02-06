import { Button } from "@/components/ui/button";
import { VideoCard } from "./video-card";
import { $api, type ApiSchemas } from "@/lib/api/client";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

type Group = ApiSchemas["LibraryResponse"][number];

export function VideosByCategory({ group }: { group: Group }) {
  const [fetch, setFetch] = useState(false);

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    $api.useInfiniteQuery(
      "get",
      "/library/{category}",
      {
        params: {
          path: { category: group.category },
          query: { page: 0 },
        },
      },
      {
        getNextPageParam: (lastPage, _, lastPageParam) =>
          lastPage.length < 6 ? undefined : (lastPageParam as number) + 1,
        initialPageParam: 1,
        pageParamName: "page",
        enabled: fetch,
      },
    );

  const rows = data?.pages.flatMap((row) => row);

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
        {group.videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
        {rows?.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {(hasNextPage || !fetch) && (
        <Button
          onClick={() => (!fetch ? setFetch(true) : fetchNextPage())}
          className="mx-auto w-fit"
        >
          {isFetchingNextPage ? <Spinner label="Loading..." /> : "Load More"}
        </Button>
      )}
    </>
  );
}
