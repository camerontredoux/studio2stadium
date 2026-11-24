import { Button } from "@/components/ui/button";
import { US_STATES } from "@/utils/constants/states";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GraduationCapIcon,
  MapPinIcon,
  SparklesIcon,
  TargetIcon,
} from "lucide-react";
import { useState } from "react";
import { feedQueries } from "../../api/queries";

function formatFeaturedThrough(iso: string): string {
  const [date] = iso.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[month - 1]} ${day}, ${year}`;
}

export function PrioritySpotlight() {
  const { data: all } = useSuspenseQuery(feedQueries.prioritySpotlights());
  const [index, setIndex] = useState(0);

  // The feed only features currently-active placements; expired ones live in
  // the "History" tab on the View all page.
  const data = all.filter((d) => d.active);
  const isEmpty = data.length === 0;
  const current = isEmpty ? null : data[Math.min(index, data.length - 1)];
  const canPage = data.length > 1;

  return (
    <div className="border-brand/40 overflow-clip rounded-2xl border">
      <div className="from-brand/10 via-brand/5 to-background relative overflow-clip bg-linear-to-br p-4">
        <div className="text-brand absolute -top-1 -left-2 -z-10 flex items-center gap-2 opacity-10">
          <SparklesIcon className="size-24 rotate-6" />
          <SparklesIcon className="size-16 rotate-186" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Dancer Spotlights</h2>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span>{data.length} new</span>
            <span aria-hidden>·</span>
            <Link
              to="/recruiting/priority-spotlights"
              className="hover:text-brand font-medium underline underline-offset-4"
            >
              View all
            </Link>
          </div>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Explore dancers who have chosen to spotlight their profiles with your program.
        </p>
      </div>

      {isEmpty || !current ? (
        <div className="border-t p-2 sm:p-4">
          <div className="text-muted-foreground flex min-h-36 flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-6 text-center text-sm">
            <p className="font-medium">No dancer spotlights right now.</p>
            <p className="text-xs">
              Featured dancer profiles will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="border-t p-2 sm:p-4">
        <div className="bg-card flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:p-4">
          <div className="bg-muted size-28 shrink-0 self-center overflow-clip rounded-xl sm:size-36 sm:self-start">
            {current.avatar ? (
              <img
                src={current.avatar}
                alt={current.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center text-2xl font-semibold">
                {current.name.slice(0, 1)}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h3 className="text-xl font-bold tracking-tight">{current.name}</h3>
            <div className="text-muted-foreground flex flex-col gap-1.5 text-sm">
              <span className="flex items-center gap-2">
                <MapPinIcon className="text-brand size-4 shrink-0" />
                {US_STATES[current.location as keyof typeof US_STATES] ??
                  current.location}
                {current.gradYear ? ` · Class of ${current.gradYear}` : null}
              </span>
              {current.gpa != null && (
                <span className="flex items-center gap-2">
                  <GraduationCapIcon className="text-brand size-4 shrink-0" />
                  {current.gpa} GPA
                </span>
              )}
              <span className="flex items-center gap-2">
                <TargetIcon className="text-brand size-4 shrink-0" />
                Interested in your program
              </span>
              <span className="flex items-center gap-2">
                <CalendarIcon className="text-brand size-4 shrink-0" />
                Featured through {formatFeaturedThrough(current.featuredUntil)}
              </span>
            </div>
            <Button
              className="mt-1 w-full sm:w-auto"
              render={
                <Link
                  to="/$username"
                  params={{ username: current.username }}
                />
              }
            >
              View Dancer
            </Button>
          </div>
        </div>

        {canPage && (
          <div className="text-muted-foreground mt-3 flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              aria-label="Previous spotlight"
              className="hover:text-foreground disabled:opacity-40"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <span className="tabular-nums">
              {index + 1} of {data.length}
            </span>
            <button
              type="button"
              aria-label="Next spotlight"
              className="hover:text-foreground disabled:opacity-40"
              disabled={index >= data.length - 1}
              onClick={() => setIndex((i) => Math.min(data.length - 1, i + 1))}
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
