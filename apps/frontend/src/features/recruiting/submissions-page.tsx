import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { components } from "@/lib/api/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  SendIcon,
  Settings2Icon,
  TrophyIcon,
} from "lucide-react";
import { useState } from "react";
import { recruitingQueries } from "./api/queries";
import { Filters } from "./components/filters";
import { RecruitingSidebar } from "./components/sidebar/sidebar";
import { SubmissionCard } from "./components/submission-card";

type Submission =
  components["schemas"]["DancersSubmissionsResponse"]["submissions"][number];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupByDate(submissions: Submission[]) {
  const groups: { date: string; submissions: Submission[] }[] = [];
  const sorted = [...submissions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  for (const sub of sorted) {
    const dateStr = formatDate(sub.updatedAt);
    const last = groups[groups.length - 1];
    if (last?.date === dateStr) {
      last.submissions.push(sub);
    } else {
      groups.push({ date: dateStr, submissions: [sub] });
    }
  }
  return groups;
}

function filterSubmissions(
  submissions: Submission[],
  status: string,
  watched: string,
) {
  return submissions.filter((s) => {
    if (status !== "all" && s.status !== status) return false;
    if (watched !== "all") {
      const isWatched = s.watched;
      if (watched === "watched" && !isWatched) return false;
      if (watched === "not_watched" && isWatched) return false;
    }
    return true;
  });
}

export function SubmissionsPage() {
  const { data } = useSuspenseQuery(recruitingQueries.submissions());

  const submissions = data.submissions;
  const [status, setStatus] = useState("all");
  const [watched, setWatched] = useState("all");

  const filtered = filterSubmissions(submissions, status, watched);
  const grouped = groupByDate(filtered);

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
          <div className="flex gap-2 max-sm:pl-1">
            <Popover>
              <PopoverTrigger render={<Button variant="outline" size="sm" />}>
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
            <Button size="sm" render={<Link to="/recruiting/submit" />}>
              <SendIcon /> Submit
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:gap-4">
          {grouped.map((group) => (
            <section
              key={group.date}
              className="relative flex flex-col gap-2 lg:gap-3"
            >
              <div className="sticky top-12 z-10 py-2">
                <div className="flex items-center gap-2">
                  <div className="border-brand/20 bg-background/90 flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-sm">
                    <CalendarIcon className="text-brand size-3.5" />
                    <span className="text-brand text-sm font-semibold">
                      {group.date}
                    </span>
                  </div>
                </div>
              </div>
              <Separator className="absolute top-6 left-0 -z-10 flex-1" />
              <div className="flex flex-col gap-2 lg:gap-3">
                {group.submissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="bg-muted/50 rounded-xl border p-4">
              <TrophyIcon className="text-muted-foreground size-8" />
            </div>
            <div>
              <p className="font-semibold">No submissions match</p>
              <p className="text-muted-foreground text-sm">
                Try adjusting your filters
              </p>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
