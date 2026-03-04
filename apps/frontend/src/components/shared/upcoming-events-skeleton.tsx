import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";

function UpcomingEventSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Row 1: badge + title (text-sm → h-5) */}
        <div className="flex h-5 items-center gap-2">
          <Skeleton className="h-4.5 w-14 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-32 shrink-0" />
        </div>
        {/* Row 2: organizer (text-xs → h-4) */}
        <Skeleton className="h-4 w-24" />
        {/* Row 3: date + location (text-xs → h-4) */}
        <div className="flex h-4 items-center gap-2">
          <div className="flex items-center gap-1">
            <Skeleton className="size-3 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="size-3 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function UpcomingEventsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Upcoming Events
          <Button className="ml-auto" size="xs" render={<Link to="/events" />}>
            View All
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            {i > 0 && <Separator />}
            <UpcomingEventSkeleton />
          </div>
        ))}
      </FramePanel>
    </Frame>
  );
}
