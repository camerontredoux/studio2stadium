import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/components/utils/format";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarIcon, UsersIcon } from "lucide-react";
import { recruitingQueries } from "../../api/queries";
import type { SchoolSubmission } from "../../types";
import { SchoolSubmissionCard } from "./school-submission-card";

type SchoolSubmissionsListProps = {
  status: string;
  watched: string;
};

function filterSubmissions(
  submissions: SchoolSubmission[],
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

function groupByDate(submissions: SchoolSubmission[]) {
  const groups: { date: string; submissions: SchoolSubmission[] }[] = [];
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

export function SchoolSubmissionsList({
  status,
  watched,
}: SchoolSubmissionsListProps) {
  const { data } = useSuspenseQuery(recruitingQueries.schoolSubmissions());

  const filtered = filterSubmissions(data, status, watched);
  const grouped = groupByDate(filtered);

  return (
    <div className="flex flex-col gap-2 lg:gap-4">
      {grouped.length > 0 ? (
        grouped.map((group) => (
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
                <SchoolSubmissionCard
                  key={submission.id}
                  submission={submission}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="text-brand">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No submissions match criteria</EmptyTitle>
            <EmptyDescription>Try adjusting your filters</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
