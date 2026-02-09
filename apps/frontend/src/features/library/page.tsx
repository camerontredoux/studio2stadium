import { TabsContent } from "@/components/ui/tabs";
import { Suspense } from "react";
import { VideoList } from "./components/video-list";
import { VideoListSkeleton } from "./components/video-skeleton";

export function LibraryPage() {
  return (
    <TabsContent value="/resources/library">
      <div className="relative flex flex-col gap-2">
        <Suspense fallback={<VideoListSkeleton />}>
          <VideoList />
        </Suspense>
      </div>
    </TabsContent>
  );
}
