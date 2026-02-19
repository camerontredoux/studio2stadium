import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";

function SuggestedProgramSkeleton() {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <Skeleton className="size-12 shrink-0 self-start rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Row 1: title only (text-sm → h-5), no badge */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-40 shrink-0" />
          <Skeleton className="h-4.5 w-12 shrink-0 self-center rounded-md" />
        </div>
        {/* Row 2: location (text-xs → h-4) */}
        <div className="flex h-3 items-center gap-1">
          <Skeleton className="size-3 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        {/* Row 3: students (text-xs → h-4) */}
        <div className="flex h-4 items-center gap-1">
          <Skeleton className="size-3 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SuggestedProgramsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Suggested Programs
          <Button size="xs" className="ml-auto" render={<Link to="/explore" />}>
            Explore
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="divide-y">
        {Array.from({ length: count }).map((_, i) => (
          <SuggestedProgramSkeleton key={i} />
        ))}
      </FramePanel>
    </Frame>
  );
}
