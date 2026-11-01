import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SchoolListSkeleton } from "@/features/explore/components/schools/school-skeleton";
import { Settings2Icon } from "lucide-react";
import { Suspense, useState } from "react";
import { Filters } from "../filters";
import { SchoolStatsSidebar } from "./school-stats-sidebar";
import { SchoolSubmissionsList } from "./school-submissions-list";

export function SchoolSubmissionsPage() {
  const [watched, setWatched] = useState("all");
  const [status, setStatus] = useState("all");
  const [watchingId, setWatchingId] = useState<string | null>(null);

  return (
    <SidebarLayout
      sidebar={<SchoolStatsSidebar />}
      tabs={{ contentLabel: "Submissions", sidebarLabel: "Stats" }}
    >
      <div className="mobile:pb-14 flex flex-col gap-2 pt-1 sm:pt-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-col max-sm:pl-1">
            <h1 className="text-2xl leading-none font-bold tracking-tight">
              Common Recruiting
            </h1>
            <p className="text-muted-foreground text-sm">
              Review dancer submissions to your program
            </p>
          </div>
          <div className="flex gap-2 max-sm:w-full max-sm:pl-1">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:max-w-fit"
                  />
                }
              >
                <Settings2Icon /> Filters
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <Filters
                  status={status}
                  watched={watched}
                  onStatusChange={setStatus}
                  onWatchedChange={setWatched}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Suspense fallback={<SchoolListSkeleton />}>
          <SchoolSubmissionsList
            status={status}
            watched={watched}
            watchingId={watchingId}
            onWatchingChange={setWatchingId}
          />
        </Suspense>
      </div>
    </SidebarLayout>
  );
}
