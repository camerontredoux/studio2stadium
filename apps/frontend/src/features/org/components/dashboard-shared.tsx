import {
  CalendarIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
} from "lucide-react";

import { cn } from "@/components/utils/cn";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import type { EventPhaseInfo } from "@/features/org/hooks/use-event-phase";

export type PanelAccent =
  | "blue"
  | "purple"
  | "amber"
  | "green"
  | "rose"
  | "cyan";

const ACCENT_DOT: Record<PanelAccent, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
};

export const ACCENT_VALUE: Record<PanelAccent, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  purple: "text-purple-600 dark:text-purple-400",
  amber: "text-amber-600 dark:text-amber-400",
  green: "text-emerald-600 dark:text-emerald-400",
  rose: "text-rose-600 dark:text-rose-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
};

export function AccentDot({ accent }: { accent: PanelAccent }) {
  return (
    <span
      className={cn("size-1.5 shrink-0 rounded-full", ACCENT_DOT[accent])}
      aria-hidden
    />
  );
}

export function LivePulse() {
  return (
    <span className="relative inline-flex size-2" aria-hidden>
      <span className="bg-success absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping" />
      <span className="bg-success relative inline-flex size-2 rounded-full" />
    </span>
  );
}

export function PhaseBadge({
  phase,
  isActive = false,
}: {
  phase: EventPhaseInfo;
  isActive?: boolean;
}) {
  const activeBadgeClass =
    phase.phase === "live"
      ? "border-success/60 text-success"
      : phase.phase === "upcoming" || phase.phase === "imminent"
        ? "border-warning/60 text-warning"
        : "border-border/60 text-muted-foreground";
  const badgeClass = isActive
    ? activeBadgeClass
    : "border-border/60 text-muted-foreground";

  if (phase.phase === "live") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase",
          badgeClass,
        )}
      >
        <LivePulse />
        <span className={cn(isActive ? "text-success" : "text-foreground")}>
          Day {phase.liveDay} of {phase.totalDays}
        </span>
      </span>
    );
  }
  if (phase.phase === "imminent") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase",
          badgeClass,
        )}
      >
        <span className="bg-warning size-1.5 rounded-full" aria-hidden />
        {phase.daysUntilStart === 0
          ? "Starts today"
          : `${phase.daysUntilStart}d out`}
      </span>
    );
  }
  if (phase.phase === "wrapped") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase",
          badgeClass,
        )}
      >
        Wrapped
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase tabular-nums",
        badgeClass,
      )}
    >
      {phase.daysUntilStart}d out
    </span>
  );
}

export function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: PanelAccent;
}) {
  return (
    <div className="border-border flex flex-1 flex-col justify-center gap-1 border-l px-4 py-3 first:border-l-0">
      <span
        className={cn(
          "text-2xl leading-none font-semibold tracking-tight tabular-nums 2xl:text-3xl",
          accent && ACCENT_VALUE[accent],
        )}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase 2xl:text-xs">
        {accent && <AccentDot accent={accent} />}
        {label}
      </span>
    </div>
  );
}

export function DashboardHeader({
  name,
  phase,
  dateRange,
  actions,
}: {
  name: string;
  phase: EventPhaseInfo;
  dateRange: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight 2xl:text-xl">
          {name}
        </h1>
        <PhaseBadge phase={phase} isActive />
        <span className="text-muted-foreground text-xs tabular-nums 2xl:text-sm">
          {dateRange}
        </span>
      </div>
      {actions}
    </header>
  );
}

export function SidebarSection({
  title,
  children,
  action,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  accent?: PanelAccent;
}) {
  return (
    <section className="border-border border-b last:border-b-0">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase 2xl:text-xs">
          {accent && <AccentDot accent={accent} />}
          {title}
        </span>
        {action}
      </div>
      <div className="px-4 pb-3">{children}</div>
    </section>
  );
}

export function phaseProgressPct(phase: EventPhaseInfo): number {
  if (phase.phase === "live" && phase.liveDay) {
    return Math.round((phase.liveDay / phase.totalDays) * 100);
  }
  if (phase.phase === "wrapped") return 100;
  if (phase.phase === "upcoming" || phase.phase === "imminent") {
    const horizon = 60;
    const elapsed = horizon - Math.min(horizon, phase.daysUntilStart);
    return Math.round((elapsed / horizon) * 100);
  }
  return 0;
}

export function SidebarPhaseSection({ phase }: { phase: EventPhaseInfo }) {
  const progress = phaseProgressPct(phase);
  const isEventUnderway = phase.phase === "live" || phase.phase === "wrapped";
  const progressLabel = isEventUnderway
    ? "Event progress"
    : "Approaching kickoff";
  const headline =
    phase.phase === "live"
      ? `Day ${phase.liveDay}`
      : phase.phase === "wrapped"
        ? "Wrapped"
        : phase.daysUntilStart === 0
          ? "Today"
          : `${phase.daysUntilStart}d`;
  const subhead =
    phase.phase === "live"
      ? `of ${phase.totalDays}`
      : phase.phase === "wrapped"
        ? phase.label.toLowerCase().replace(/^wrapped\s*/, "")
        : "until kickoff";

  return (
    <SidebarSection title="Countdown" accent="blue">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-foreground text-xl leading-none font-semibold tracking-tight tabular-nums 2xl:text-2xl">
            {headline}
          </span>
          <span className="text-muted-foreground text-sm tabular-nums 2xl:text-base">
            {subhead}
          </span>
        </div>
        {phase.phase === "live" && (
          <span className="text-success border-success/40 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase">
            <LivePulse />
            Live now
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] font-medium tracking-wider uppercase 2xl:text-xs">
        <span className="text-muted-foreground">{progressLabel}</span>
        <span className="text-muted-foreground tabular-nums">{progress}%</span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="bg-border relative h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className="bg-foreground h-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </SidebarSection>
  );
}

export function SidebarDetailsSection({
  orgSlug,
  event,
}: {
  orgSlug: string;
  event: OrgEvent;
}) {
  return (
    <SidebarSection title="Details">
      <ul className="flex flex-col gap-2 text-xs 2xl:text-sm">
        <li className="flex items-start gap-2">
          <CalendarIcon className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
          <span className="tabular-nums">
            {formatLongDateRange(event.startDate, event.endDate)}
          </span>
        </li>
        {event.venueName && (
          <li className="flex items-start gap-2">
            <MapPinIcon className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
            <div className="flex min-w-0 flex-col">
              <span>{event.venueName}</span>
              {event.venueAddress && (
                <span className="text-muted-foreground truncate">
                  {event.venueAddress}
                </span>
              )}
            </div>
          </li>
        )}
        {event.contactEmail && (
          <li className="flex items-center gap-2">
            <MailIcon className="text-muted-foreground size-3.5 shrink-0" />
            <a
              href={`mailto:${event.contactEmail}`}
              className="hover:text-brand truncate"
            >
              {event.contactEmail}
            </a>
          </li>
        )}
        {event.schedulePdfUrl && (
          <li className="flex items-center gap-2">
            <ExternalLinkIcon className="text-muted-foreground size-3.5 shrink-0" />
            <a
              href={scheduleFileUrl(orgSlug, event.id)}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand truncate"
            >
              View schedule
            </a>
          </li>
        )}
      </ul>
    </SidebarSection>
  );
}

export function scheduleFileUrl(orgSlug: string, eventId: string): string {
  return `${import.meta.env.VITE_API_URL}/orgs/${orgSlug}/events/${eventId}/schedule`;
}

export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDateRange(startYmd: string, endYmd: string): string {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  const sameDay = sameMonth && start.getDate() === end.getDate();
  const month = (d: Date) => d.toLocaleString(undefined, { month: "short" });
  const year = (d: Date) => d.getFullYear();

  if (sameDay) return `${month(start)} ${start.getDate()}, ${year(start)}`;
  if (sameMonth)
    return `${month(start)} ${start.getDate()}–${end.getDate()}, ${year(start)}`;
  if (start.getFullYear() === end.getFullYear())
    return `${month(start)} ${start.getDate()} – ${month(end)} ${end.getDate()}, ${year(start)}`;
  return `${month(start)} ${start.getDate()}, ${year(start)} – ${month(end)} ${end.getDate()}, ${year(end)}`;
}

export function formatLongDateRange(startYmd: string, endYmd: string): string {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  const startLabel = start.toLocaleDateString(undefined, opts);
  const endLabel = end.toLocaleDateString(undefined, opts);
  if (startLabel === endLabel) return `${startLabel}, ${start.getFullYear()}`;
  return `${startLabel} – ${endLabel}, ${end.getFullYear()}`;
}
