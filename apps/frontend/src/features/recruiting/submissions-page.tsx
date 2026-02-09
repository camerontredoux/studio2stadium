import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { CalendarIcon, SendIcon, TrophyIcon } from "lucide-react";
import { useState } from "react";
import { RecruitingFilterSheet } from "./components/filters/filter-sheet";
import {
  MOCK_SUBMISSIONS,
  type SchoolSubmission,
} from "./components/mock-data";
import { RecruitingSidebar } from "./components/sidebar/sidebar";
import { RecruitingSidebarDialog } from "./components/sidebar/sidebar-dialog";
import { SubmissionCard } from "./components/submission-card";

function groupByDate(submissions: SchoolSubmission[]) {
  const groups: { date: string; submissions: SchoolSubmission[] }[] = [];
  for (const sub of submissions) {
    const last = groups[groups.length - 1];
    if (last?.date === sub.submittedAt) {
      last.submissions.push(sub);
    } else {
      groups.push({ date: sub.submittedAt, submissions: [sub] });
    }
  }
  return groups;
}

function filterSubmissions(
  submissions: SchoolSubmission[],
  prospectStatus: string,
  videoStatus: string,
) {
  return submissions.filter((s) => {
    if (prospectStatus !== "all" && s.prospectStatus !== prospectStatus)
      return false;
    if (videoStatus !== "all" && s.videoStatus !== videoStatus) return false;
    return true;
  });
}

export function SubmissionsPage() {
  const [prospectStatus, setProspectStatus] = useState("all");
  const [videoStatus, setVideoStatus] = useState("all");

  const filtered = filterSubmissions(
    MOCK_SUBMISSIONS,
    prospectStatus,
    videoStatus,
  );
  const grouped = groupByDate([...filtered].reverse());

  return (
    <SidebarLayout sidebar={<RecruitingSidebar />}>
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
            <RecruitingSidebarDialog />
            <RecruitingFilterSheet
              prospectStatus={prospectStatus}
              videoStatus={videoStatus}
              onProspectStatusChange={setProspectStatus}
              onVideoStatusChange={setVideoStatus}
              onClear={() => {
                setProspectStatus("all");
                setVideoStatus("all");
              }}
            />
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
