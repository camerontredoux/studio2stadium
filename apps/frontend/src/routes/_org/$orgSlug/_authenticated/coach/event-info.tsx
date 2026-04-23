import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  ExternalLinkIcon,
  FileTextIcon,
  HeartIcon,
  MailIcon,
  MapPinIcon,
  SearchIcon,
  TrophyIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import {
  useEventPhase,
  type EventPhaseInfo,
} from "@/features/org/hooks/use-event-phase";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/event-info",
)({
  component: EventInfo,
});

function EventInfo() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useQuery(adminQueries.events(orgSlug));
  const activeEvent = events?.find((e) => e.isActive) ?? null;

  if (!activeEvent) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No active event.
      </div>
    );
  }

  return <EventInfoDashboard orgSlug={orgSlug} event={activeEvent} />;
}

function EventInfoDashboard({
  orgSlug,
  event,
}: {
  orgSlug: string;
  event: OrgEvent;
}) {
  const { org } = useOrg();
  const { data: dancers } = useQuery(scoutingQueries.dancers(orgSlug));
  const { data: favorites } = useQuery(
    scoutingQueries.favorites(orgSlug),
  );

  const phase = useEventPhase(event.startDate, event.endDate);

  const dancerCount = dancers?.length ?? 0;
  const favCount = favorites?.length ?? 0;

  const dateRange = formatDateRange(event.startDate, event.endDate);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden">
      {/* Main content */}
      <div className="flex min-w-0 flex-col gap-4 xl:flex-1 xl:overflow-y-auto">
        {/* Event header */}
        <div>
          <h1 className="text-2xl font-semibold">{event.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <PhaseBadge phase={phase} />
            <span className="text-muted-foreground text-sm">{dateRange}</span>
          </div>
        </div>

        {/* Stat cells */}
        <div className="border-border grid grid-cols-3 divide-x border-y">
          <StatCell label="Dancers" value={dancerCount} />
          <StatCell label="Schools" value="—" />
          <StatCell label="Your Favorites" value={favCount} />
        </div>

        {/* Quick links */}
        <Frame>
          <FramePanel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <QuickLink
                orgSlug={orgSlug}
                to="/$orgSlug/coach/dancers"
                icon={SearchIcon}
                label="Search Dancers"
              />
              <QuickLink
                orgSlug={orgSlug}
                to="/$orgSlug/coach/favorites"
                icon={HeartIcon}
                label="My Favorites"
              />
              <QuickLink
                orgSlug={orgSlug}
                to="/$orgSlug/coach/rankings"
                icon={TrophyIcon}
                label="My Rankings"
              />
              <Button
                variant="outline"
                className="h-10 gap-2"
                render={
                  <a
                    href="https://studio2stadium.com/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <ExternalLinkIcon className="size-4" />
                Edit Profile
              </Button>
            </div>
          </FramePanel>
        </Frame>
      </div>

      {/* Right sidebar */}
      <aside className="w-full border-t p-4 xl:w-80 xl:shrink-0 xl:overflow-y-auto xl:border-t-0 xl:border-l">
        <div className="flex flex-col gap-6">
          {/* Countdown */}
          <div>
            <p className="text-2xl font-bold tabular-nums">{phase.label}</p>
            {phase.phase === "live" && phase.totalDays > 1 && (
              <div className="mt-2">
                <div className="bg-muted h-1.5 rounded-full">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{
                      width: `${((phase.liveDay ?? 1) / phase.totalDays) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {Math.round(
                    ((phase.liveDay ?? 1) / phase.totalDays) * 100,
                  )}
                  % complete
                </p>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Details</h3>
            <div className="text-muted-foreground flex items-start gap-2 text-sm">
              <CalendarIcon className="mt-0.5 size-4 shrink-0" />
              <span>{dateRange}</span>
            </div>
            {event.venueName && (
              <div className="text-muted-foreground flex items-start gap-2 text-sm">
                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p>{event.venueName}</p>
                  {event.venueAddress && (
                    <p className="text-xs">{event.venueAddress}</p>
                  )}
                </div>
              </div>
            )}
            {event.contactEmail && (
              <div className="text-muted-foreground flex items-start gap-2 text-sm">
                <MailIcon className="mt-0.5 size-4 shrink-0" />
                <a
                  href={`mailto:${event.contactEmail}`}
                  className="hover:underline"
                >
                  {event.contactEmail}
                </a>
              </div>
            )}
            {event.schedulePdfUrl && (
              <div className="text-muted-foreground flex items-start gap-2 text-sm">
                <FileTextIcon className="mt-0.5 size-4 shrink-0" />
                <a
                  href={event.schedulePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Download schedule PDF
                </a>
              </div>
            )}
          </div>

          {/* Coach program card */}
          <div className="rounded-lg border p-3">
            <h3 className="text-sm font-semibold">Your Program</h3>
            <div className="mt-2 flex items-center gap-2">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="size-8 rounded object-contain"
                />
              ) : (
                <div className="bg-primary flex size-8 items-center justify-center rounded text-sm font-semibold text-white">
                  {org.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">{org.name}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function PhaseBadge({ phase }: { phase: EventPhaseInfo }) {
  const badgeClass = {
    upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    imminent:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    live: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    wrapped: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  }[phase.phase];

  const label =
    phase.phase === "live"
      ? `Day ${phase.liveDay} of ${phase.totalDays}`
      : phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1);

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
    >
      {phase.phase === "live" && (
        <span className="mr-1 inline-block size-1.5 rounded-full bg-emerald-500" />
      )}
      {label}
    </span>
  );
}

function StatCell({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-3">
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

function QuickLink({
  orgSlug,
  to,
  icon: Icon,
  label,
}: {
  orgSlug: string;
  to: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Button
      variant="outline"
      className="h-10 gap-2"
      render={<Link to={to} params={{ orgSlug } as any} />}
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}

/* ---------- Date helpers ---------- */

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatDateRange(startYmd: string, endYmd: string): string {
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
