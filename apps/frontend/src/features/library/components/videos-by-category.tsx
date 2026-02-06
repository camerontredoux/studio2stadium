import { Button } from "@/components/ui/button";
import { VideoCard } from "./video-card";
import { type ApiSchemas } from "@/lib/api/client";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useVideosByCategory } from "../api/queries";

type Group = ApiSchemas["LibraryResponse"][number];

export function VideosByCategory({ group }: { group: Group }) {
  const [fetch, setFetch] = useState(false);

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useVideosByCategory(group.category, fetch);

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
