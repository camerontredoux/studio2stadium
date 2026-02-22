import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SchoolListSkeleton } from "@/features/explore/components/schools/school-skeleton";
import { Link } from "@tanstack/react-router";
import { SendIcon, Settings2Icon } from "lucide-react";
import { Suspense, useState } from "react";
import { Filters } from "../filters";
import { RecruitingSidebar } from "../sidebar/sidebar";
import { SubmissionsList } from "./submissions-list";

export function SubmissionsPage() {
  const [watched, setWatched] = useState("all");
  const [status, setStatus] = useState("all");

  return (
    <SidebarLayout
      sidebar={<RecruitingSidebar />}
      tabs={{ contentLabel: "Submissions", sidebarLabel: "Stats" }}
    >
      <div className="mobile:pb-14 flex flex-col gap-2 pt-1 sm:pt-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-col max-sm:pl-1">
            <h1 className="text-2xl leading-none font-bold tracking-tight">
              Common Recruiting
            </h1>
            <p className="text-muted-foreground text-sm">
              Track your submissions and school responses
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
            <Button
              size="sm"
              className="flex-1 sm:max-w-fit"
              render={<Link to="/recruiting/submit" />}
            >
              <SendIcon /> Submit
            </Button>
          </div>
        </div>

        <Suspense fallback={<SchoolListSkeleton />}>
          <SubmissionsList status={status} watched={watched} />
        </Suspense>
      </div>
    </SidebarLayout>
  );
}
