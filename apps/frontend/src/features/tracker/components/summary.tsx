import { Badge } from "@/components/ui/badge";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { cn } from "@/components/utils/cn";
import { CalendarIcon, TrophyIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import type {
  TrackerItem as Item,
  TrackerMilestone as Milestone,
} from "../api/mutations";
import { burstFrom } from "../celebrate";
import {
  byUrgency,
  daysUntil,
  formatDate,
  isDone,
  findCommitted,
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

export function Momentum({
  items,
  milestones,
}: {
  items: Item[];
  milestones: Milestone[];
}) {
  // A dancer commits to one school, so the journey is complete once they've
  // committed and everything else is done.
  const others = items.filter((i) => i.type !== "school");
  const committedTo = findCommitted(items)?.school?.name;
  const complete = !!committedTo && others.every(isDone);
  const schools = new Set(
    items.flatMap((i) => (i.school ? [i.school.id] : [])),
  );
  const open = items.filter((i) => !isDone(i));
  const dueSoon = open.filter((i) => i.date && daysUntil(i.date) <= 30);
  const stats = [
    { value: schools.size, label: schools.size === 1 ? "School" : "Schools" },
    { value: dueSoon.length, label: "Due in 30 days", short: "Due soon" },
    {
      value:
        others.filter(isDone).length +
        milestones.filter((m) => m.completedAt).length,
      label: "Completed",
    },
  ];

  const medalRef = useRef<HTMLDivElement>(null);
  const wasComplete = useRef(complete);

  // Celebrate completing the journey, but not a page that loads complete. Small
  // screens hide the medal, so the confetti comes from the headline instead.
  useEffect(() => {
    const medal = medalRef.current;
    if (complete && !wasComplete.current && medal?.parentElement) {
      burstFrom(medal.offsetWidth ? medal : medal.parentElement);
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
            <div
              ref={medalRef}
              className="relative size-11 shrink-0 max-sm:hidden"
            >
              {/* Two thin gold rings, each with a slot, turning at different
                  speeds. The outer one sits behind the medal, and the medal's
                  white ring covers all but its outer 2px. The inner one is
                  drawn over that white ring and masked down to 1.5px. */}
              <div
                aria-hidden
                className="absolute -inset-2 animate-[spin_6s_linear_infinite] rounded-full bg-[conic-gradient(var(--brand)_0_88%,transparent_88%_100%)] motion-reduce:animate-none"
              />
              <div className="bg-brand ring-background relative grid size-full place-items-center rounded-full text-white shadow-lg ring-6">
                <TrophyIcon aria-hidden className="size-5" />
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-[3px] animate-[spin_3.5s_linear_infinite] rounded-full bg-[conic-gradient(from_180deg,var(--brand)_0_88%,transparent_88%_100%)] [mask:radial-gradient(farthest-side,transparent_calc(100%-1.5px),#000_calc(100%-1.5px))] motion-reduce:animate-none"
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <p className="text-lg leading-tight font-semibold">
                Every step taken
              </p>
              <p className="text-muted-foreground text-xs">
                Committed to {committedTo}.
                <span className="@max-sm:hidden">
                  {" "}
                  That's the whole journey.
                </span>
              </p>
            </div>
          </div>
        )}
        {/* Narrow cards stack the counts; three boxes need about 288px.
            Once complete the headline says it all, so the counts are hidden. */}
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
                    <div className="text-muted-foreground flex min-w-0 items-center gap-3 text-xs">
                      <span className="truncate">
                        {item.school?.name ?? label}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <CalendarIcon aria-hidden className="size-3" />
                        {formatDate(item.date)}
                      </span>
                    </div>
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
