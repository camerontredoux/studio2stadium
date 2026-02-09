import { Button } from "@/components/ui/button";
import { VideoCard } from "./video-card";
import { type ApiSchemas } from "@/lib/api/client";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useVideosByCategory } from "../api/queries";
import { ChevronDownIcon } from "lucide-react";

type Group = ApiSchemas["LibraryResponse"][number];

export function VideosByCategory({ group }: { group: Group }) {
  const [enabled, setEnabled] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetching } =
    useVideosByCategory(group.category, enabled);

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

      {(!enabled || hasNextPage || isFetching) && (
        <div className="flex items-center gap-3 pt-1">
          <div className="h-px flex-1 bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (enabled ? fetchNextPage() : setEnabled(true))}
            disabled={isFetching}
            className="text-muted-foreground"
          >
            {isFetching ? (
              <Spinner label="Loading..." />
            ) : (
              <>
                Load More
                <ChevronDownIcon />
              </>
            )}
          </Button>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}
    </>
  );
}
