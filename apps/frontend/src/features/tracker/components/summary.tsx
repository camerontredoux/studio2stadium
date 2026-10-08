import { Badge } from "@/components/ui/badge";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/components/utils/cn";
import { TrophyIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import type { TrackerItem as Item } from "../api/mutations";
import { burstFrom } from "../celebrate";
import {
  byUrgency,
  daysUntil,
  formatDate,
  isDone,
  STAGES,
  TYPES,
} from "../stages";

export function DueBadge({ date }: { date: string }) {
  const days = daysUntil(date);
  if (days < 0) {
    const n = -days;
    return (
      <Badge variant="error" size="sm">
        {n} {n === 1 ? "day" : "days"} overdue
      </Badge>
    );
  }
  if (days <= 1) {
    return (
      <Badge variant="warning" size="sm">
        {days === 0 ? "Today" : "Tomorrow"}
      </Badge>
    );
  }
  if (days > 30) return null;
  return (
    <Badge variant="info" size="sm">
      In {days} days
    </Badge>
  );
}

export function Momentum({ items }: { items: Item[] }) {
  const reached = items.reduce((n, i) => n + i.stage, 0);
  const total = items.reduce((n, i) => n + STAGES[i.type].length - 1, 0);
  const percent = total ? Math.round((reached / total) * 100) : 0;
  const complete = total > 0 && reached === total;
  const schools = new Set(
    items.flatMap((i) => (i.school ? [i.school.id] : [])),
  );
  const open = items.filter((i) => !isDone(i));
  const dueSoon = open.filter((i) => i.date && daysUntil(i.date) <= 30);
  const stats = [
    { value: schools.size, label: schools.size === 1 ? "School" : "Schools" },
    { value: dueSoon.length, label: "Due in 30 days", short: "Due soon" },
    { value: items.length - open.length, label: "Completed" },
  ];

  const medalRef = useRef<HTMLDivElement>(null);
  const wasComplete = useRef(complete);

  // Celebrate reaching 100%, but not a page that loads at 100%.
  useEffect(() => {
    if (complete && !wasComplete.current && medalRef.current) {
      burstFrom(medalRef.current);
    }
    wasComplete.current = complete;
  }, [complete]);

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Your momentum</FrameTitle>
      </FrameHeader>
      {/* Sized by the card, not the screen: from md to lg it is half width. */}
      <FramePanel
        className={cn(
          "@container flex w-full flex-col gap-4",
          complete &&
            "from-brand/25 via-brand/10 to-background isolate bg-linear-to-br",
        )}
      >
        {complete && (
          <div className="flex items-center gap-4">
            <div ref={medalRef} className="relative size-14 shrink-0">
              {/* A slowly turning gold ring behind the medal. */}
              <div
                aria-hidden
                className="absolute -inset-2 animate-[spin_6s_linear_infinite] rounded-full bg-[conic-gradient(var(--brand),transparent_40%,var(--brand)_60%,transparent_90%,var(--brand))] motion-reduce:animate-none"
              />
              <div className="bg-brand ring-background relative grid size-full place-items-center rounded-full text-white shadow-lg ring-4">
                <TrophyIcon aria-hidden className="size-6" />
              </div>
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="text-lg leading-tight font-semibold">
                Every step taken
              </p>
              <p className="text-muted-foreground text-xs">
                {total} of {total} steps
                {schools.size > 0 &&
                  ` across ${schools.size} ${schools.size === 1 ? "school" : "schools"}`}
                .
                <span className="@max-sm:hidden">
                  {" "}
                  That's the whole journey.
                </span>
              </p>
            </div>
          </div>
        )}
        <Progress value={percent}>
          <div className="flex items-center justify-between gap-2">
            <ProgressLabel>Recruiting progress</ProgressLabel>
            <ProgressValue
              className={cn(
                "font-medium",
                complete && "text-brand font-semibold",
              )}
            />
          </div>
          <ProgressTrack className="h-2">
            <ProgressIndicator
              className={cn(
                "bg-brand rounded-full",
                complete &&
                  "animate-gold-shimmer bg-[linear-gradient(90deg,var(--brand),#f3e6d3,var(--brand))] bg-size-[200%_100%] motion-reduce:animate-none",
              )}
            />
          </ProgressTrack>
          {!complete && (
            <p className="text-muted-foreground text-xs">
              {reached} of {total} steps taken.
              <span className="@max-sm:hidden">
                {" "}
                Every stage you move forward counts.
              </span>
            </p>
          )}
        </Progress>
        {/* Narrow cards stack the counts; three boxes need about 288px.
            At 100% the headline says it all, so the counts are hidden. */}
        <div
          className={cn(
            "grid grid-cols-1 gap-2 @2xs:grid-cols-3",
            complete && "hidden",
          )}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-accent flex min-w-0 items-baseline gap-2 rounded-lg px-3 py-2 @2xs:flex-col @2xs:items-start @2xs:gap-0 @2xs:p-2.5 @sm:p-3"
            >
              <p className="text-xl font-semibold tabular-nums @sm:text-2xl">
                {stat.value}
              </p>
              <p className="text-xs @sm:text-sm">
                {stat.short ? (
                  <>
                    <span className="@sm:hidden">{stat.short}</span>
                    <span className="@max-sm:hidden">{stat.label}</span>
                  </>
                ) : (
                  stat.label
                )}
              </p>
            </div>
          ))}
        </div>
      </FramePanel>
    </Frame>
  );
}

export function NextUp({ items }: { items: Item[] }) {
  const next = items
    .filter((i) => i.date && !isDone(i))
    .sort(byUrgency)
    .slice(0, 3);

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Next up</FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        {next.length === 0 ? (
          <p className="text-muted-foreground p-4 text-sm">
            Nothing scheduled. Add a date to an item to see it here.
          </p>
        ) : (
          <ul className="divide-y">
            {next.map((item) => {
              const { label, Icon } = TYPES[item.type];
              return (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <Icon
                    aria-hidden
                    className="text-brand mt-0.5 size-4 shrink-0"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {item.school?.name ?? label} · {formatDate(item.date)}
                    </p>
                  </div>
                  {item.date && <DueBadge date={item.date} />}
                </li>
              );
            })}
          </ul>
        )}
      </FramePanel>
    </Frame>
  );
}
