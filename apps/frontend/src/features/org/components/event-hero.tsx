import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";
import {
  CalendarIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  TimerIcon,
} from "lucide-react";
import { format } from "date-fns";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import { useEventPhase } from "@/features/org/hooks/use-event-phase";
import { RosterActivationRing } from "./roster-activation-ring";

interface EventHeroProps {
  event: OrgEvent;
  registered: number;
  total: number;
  onEditEvent: () => void;
  onOpenCommand: () => void;
}

function formatDateRange(startYmd: string, endYmd: string): string {
  const start = parseYmdLocal(startYmd);
  const end = parseYmdLocal(endYmd);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${format(start, "MMM d")}–${format(end, "d, yyyy")}`;
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameYear) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function EventHero({
  event,
  registered,
  total,
  onEditEvent,
  onOpenCommand,
}: EventHeroProps) {
  const phase = useEventPhase(event.startDate, event.endDate);

  const phaseClasses = {
    upcoming: "text-muted-foreground",
    imminent: "text-amber-600 dark:text-amber-400",
    live: "text-emerald-600 dark:text-emerald-400",
    wrapped: "text-muted-foreground",
  } as const;

  const phaseIcon = {
    upcoming: <TimerIcon className="size-3.5" />,
    imminent: <TimerIcon className="size-3.5" />,
    live: <LiveDot />,
    wrapped: <TimerIcon className="size-3.5" />,
  } as const;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border",
        "bg-linear-to-br from-card via-card to-card/60",
      )}
    >
      {/* Brand-colored left accent bar */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{
          background:
            "linear-gradient(to bottom, var(--org-primary, var(--color-primary)), var(--org-accent, var(--color-primary)))",
        }}
        aria-hidden="true"
      />
      {/* Soft brand wash in top-right */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full opacity-[0.08] blur-3xl"
        style={{ backgroundColor: "var(--org-primary, var(--color-primary))" }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-8 p-6 pl-8 lg:p-10 lg:pl-12 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div
              className={cn(
                "inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase",
                phaseClasses[phase.phase],
              )}
            >
              {phaseIcon[phase.phase]}
              <span>{phase.label}</span>
            </div>
            <h1 className="text-foreground text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
              {event.name}
            </h1>
          </div>

          <dl className="text-muted-foreground flex flex-col gap-2 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 shrink-0" aria-hidden="true" />
              <dd>{formatDateRange(event.startDate, event.endDate)}</dd>
            </div>
            {event.venueName && (
              <div className="flex items-start gap-2">
                <MapPinIcon
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <dd className="min-w-0">
                  <span className="text-foreground font-medium">
                    {event.venueName}
                  </span>
                  {event.venueAddress && (
                    <span className="text-muted-foreground">
                      {" · "}
                      {event.venueAddress}
                    </span>
                  )}
                </dd>
              </div>
            )}
            {event.contactEmail && (
              <div className="flex items-center gap-2">
                <MailIcon className="size-4 shrink-0" aria-hidden="true" />
                <dd>
                  <a
                    href={`mailto:${event.contactEmail}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {event.contactEmail}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="default"
              onClick={onEditEvent}
              className="gap-1.5"
            >
              <PencilIcon className="size-3.5" />
              Edit event
            </Button>
            {event.schedulePdfUrl && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                render={
                  <a
                    href={event.schedulePdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                Schedule.pdf
                <ExternalLinkIcon className="size-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpenCommand}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <span>Commands</span>
              <kbd className="border-border/60 bg-muted/60 inline-flex h-5 items-center gap-0.5 rounded border px-1.5 text-[10px] font-mono font-semibold">
                ⌘K
              </kbd>
            </Button>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center justify-start xl:w-auto xl:self-center">
          <RosterActivationRing
            registered={registered}
            total={total}
            className="w-full max-w-sm"
          />
        </div>
      </div>
    </section>
  );
}

function LiveDot() {
  return (
    <span className="relative inline-flex size-2">
      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
    </span>
  );
}
