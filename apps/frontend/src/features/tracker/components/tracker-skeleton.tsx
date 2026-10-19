import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";

function SchoolCardSkeleton() {
  return (
    <Frame>
      <FrameHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-4.5 w-40" />
        </div>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-2/5" />
      </FramePanel>
    </Frame>
  );
}

// Holds the tracker's layout while its items load, so the app shell stays put.
export function TrackerSkeleton() {
  return (
    <div className="mobile:pb-14 flex flex-col gap-2 pt-1 sm:pt-0">
      <div className="mb-2 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col max-sm:pl-1">
          <h1 className="text-2xl leading-none font-bold tracking-tight">
            My Recruiting Tracker
          </h1>
          <p className="text-muted-foreground text-sm">
            Keep your schools, clinics, auditions, and deadlines in one place.
          </p>
        </div>
        <Skeleton className="h-8 w-26 rounded-lg" />
      </div>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 items-start gap-2 *:min-w-0 md:grid-cols-2 md:gap-4">
          <Frame>
            <FrameHeader>
              <FrameTitle>Your momentum</FrameTitle>
            </FrameHeader>
            <FramePanel className="grid grid-cols-3 gap-2">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </FramePanel>
          </Frame>
          <Frame>
            <FrameHeader>
              <FrameTitle>Next up</FrameTitle>
            </FrameHeader>
            <FramePanel className="flex flex-col gap-3">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-2/3" />
            </FramePanel>
          </Frame>
        </div>
        <SchoolCardSkeleton />
        <SchoolCardSkeleton />
      </div>
    </div>
  );
}
