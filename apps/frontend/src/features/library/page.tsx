import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { ResourcesFilterSheet } from "@/features/library/components/filters/filter-sheet";
import { groupedVideos } from "@/features/library/components/mock-data";
import { VideoCard } from "@/features/library/components/video-card";
import { TagIcon } from "lucide-react";

export function LibraryPage() {
  return (
    <TabsContent value="/resources/library">
      <div className="flex flex-col gap-2 lg:gap-4 lg:pt-2">
        {groupedVideos.map((group) => (
          <section
            key={group.type}
            className="relative flex flex-col gap-2 lg:gap-3"
          >
            <div className="sticky z-10 top-25 py-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-brand/20 bg-background/90 backdrop-blur-sm px-2.5 py-1">
                  <TagIcon className="size-3.5 text-brand" />
                  <span className="text-sm font-semibold text-brand">
                    {group.type}
                  </span>
                </div>
              </div>
            </div>
            <Separator className="flex-1 -z-10 absolute top-6 left-0" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
              {group.videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            <div className="absolute right-0 z-20 bg-background top-2">
              <ResourcesFilterSheet />
            </div>
          </section>
        ))}
      </div>
    </TabsContent>
  );
}
