import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { SubmissionCard } from "@/features/recruiting/components/submissions/submission-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarIcon, TrophyIcon } from "lucide-react";
import { recruitingQueries } from "../../api/queries";
import { filterSubmissions, groupByDate } from "./utils";

type SubmissionsListProps = {
  status: string;
  watched: string;
};

export function SubmissionsList({ status, watched }: SubmissionsListProps) {
  const { data } = useSuspenseQuery(recruitingQueries.submissions());

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
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon" className="text-brand">
              <TrophyIcon />
            </EmptyMedia>
            <EmptyTitle>No submissions match criteria</EmptyTitle>
            <EmptyDescription>Try adjusting your filters</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
