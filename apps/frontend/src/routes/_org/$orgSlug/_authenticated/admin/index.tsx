import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PlusIcon,
  UploadIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import { client } from "@/lib/api/client";
import {
  adminQueries,
  type CsvUploadSummary,
  type OrgEvent,
} from "@/features/org/api/admin-queries";
import {
  CreateEventForm,
  EventFormSheet,
} from "@/features/org/components/event-form-sheet";
import { RosterUploadRow } from "@/features/org/components/roster-upload-row";
import {
  useEventPhase,
  type EventPhaseInfo,
} from "@/features/org/hooks/use-event-phase";
import {
  useAdminCommandListener,
  useAdminCommands,
} from "@/features/org/hooks/use-admin-commands";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/admin/")({
  component: AdminHome,
});

function AdminDashboard({
  orgSlug,
  events,
  activeEvent,
}: {
  orgSlug: string;
  events: OrgEvent[];
  activeEvent: OrgEvent;
}) {
  const { data: stats } = useSuspenseQuery(
    adminQueries.stats(orgSlug, activeEvent.id),
  );
  const [editOpen, setEditOpen] = useState(false);
  useAdminCommands();

  useAdminCommandListener(
    (a) => a.type === "open-edit-event",
    () => setEditOpen(true),
  );

  const totalRoster = stats.coaches + stats.dancers;
  const activationPct =
    totalRoster === 0 ? 0 : Math.round((stats.registered / totalRoster) * 100);

  const phase = useEventPhase(activeEvent.startDate, activeEvent.endDate);
  const dateRange = formatDateRange(activeEvent.startDate, activeEvent.endDate);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden">
      <div className="flex min-w-0 flex-col xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        <EventHeader
          name={activeEvent.name}
          phase={phase}
          dateRange={dateRange}
          registered={stats.registered}
          totalRoster={totalRoster}
          activationPct={activationPct}
        />

        <section
          aria-label="Event stats"
          className="border-border flex items-stretch border-y"
        >
          <StatCell label="Dancers" value={stats.dancers} />
          <StatCell label="Coaches" value={stats.coaches} />
          <StatCell label="Pending" value={stats.pending} />
          <StatCell label="Active" value={stats.registered} />
        </section>

        <section
          aria-label="Roster uploads"
          className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2"
        >
          <RosterUploadRow
            orgSlug={orgSlug}
            eventId={activeEvent.id}
            type="dancer"
            lastUpload={
              stats.recentUploads.find((u) => u.type === "dancer") ?? null
            }
          />
          <RosterUploadRow
            orgSlug={orgSlug}
            eventId={activeEvent.id}
            type="coach"
            lastUpload={
              stats.recentUploads.find((u) => u.type === "coach") ?? null
            }
          />
        </section>

        <section
          aria-label="Event readiness"
          className="grid grid-cols-1 gap-3 px-4 pb-4 lg:grid-cols-5 lg:grid-rows-[14rem]"
        >
          <div className="min-h-0 lg:col-span-2">
            <PreEventChecklist phase={phase} />
          </div>
          <div className="min-h-0 lg:col-span-3">
            <TopSchoolsPanel />
          </div>
        </section>
      </div>

      <EventSidebar
        orgSlug={orgSlug}
        events={events}
        activeEvent={activeEvent}
        phase={phase}
        stats={stats.recentUploads}
        totalRoster={totalRoster}
      />

      <EventFormSheet
        orgSlug={orgSlug}
        event={activeEvent}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}

function EventHeader({
  name,
  phase,
  dateRange,
  registered,
  totalRoster,
  activationPct,
}: {
  name: string;
  phase: EventPhaseInfo;
  dateRange: string;
  registered: number;
  totalRoster: number;
  activationPct: number;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold tracking-tight">{name}</h1>
        <PhaseBadge phase={phase} />
        <span className="text-muted-foreground text-xs tabular-nums">
          {dateRange}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <span className="font-semibold tabular-nums">{registered}</span>
          <span className="text-muted-foreground">
            /{totalRoster} activated
          </span>
        </div>
        <div
          className="bg-border h-0.5 w-[120px] overflow-hidden"
          role="progressbar"
          aria-valuenow={activationPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Roster activation progress"
        >
          <div
            className="bg-foreground h-full"
            style={{ width: `${activationPct}%` }}
          />
        </div>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {activationPct}%
        </span>
      </div>
    </header>
  );
}

function PhaseBadge({ phase }: { phase: EventPhaseInfo }) {
  if (phase.phase === "live") {
    return (
      <span className="border-border/60 inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
        <LivePulse />
        <span className="text-foreground">
          Day {phase.liveDay} of {phase.totalDays}
        </span>
      </span>
    );
  }
  if (phase.phase === "imminent") {
    return (
      <span className="border-border/60 text-muted-foreground inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
        <span className="bg-warning size-1.5 rounded-full" aria-hidden />
        {phase.daysUntilStart === 0
          ? "Starts today"
          : `${phase.daysUntilStart}d out`}
      </span>
    );
  }
  if (phase.phase === "wrapped") {
    return (
      <span className="border-border/60 text-muted-foreground inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
        Wrapped
      </span>
    );
  }
  return (
    <span className="border-border/60 text-muted-foreground inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase tabular-nums">
      {phase.daysUntilStart}d out
    </span>
  );
}

function LivePulse() {
  return (
    <span className="relative inline-flex size-2" aria-hidden>
      <span className="bg-success absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:animate-ping" />
      <span className="bg-success relative inline-flex size-2 rounded-full" />
    </span>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border flex flex-1 flex-col justify-center gap-1 border-l px-4 py-3 first:border-l-0">
      <span className="text-2xl leading-none font-semibold tracking-tight tabular-nums">
        {value.toLocaleString()}
      </span>
      <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}

/* ---------- Pre-event checklist ---------- */

type ChecklistItem = {
  id: string;
  label: string;
  hint: string;
};

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "venue", label: "Venue confirmed", hint: "Contract signed, space held" },
  { id: "bibs", label: "Bibs ordered", hint: "Numbered range assigned" },
  { id: "rosters", label: "Rosters locked", hint: "No new uploads after cutoff" },
  { id: "schedule", label: "Schedule published", hint: "PDF uploaded + linked" },
  { id: "checkin", label: "Check-in desk staffed", hint: "Volunteers assigned" },
  { id: "comms", label: "Pre-event email sent", hint: "Coach brief + dancer info" },
];

function PreEventChecklist({ phase }: { phase: EventPhaseInfo }) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set(["venue", "bibs"]));
  const done = DEFAULT_CHECKLIST.filter((i) => checked.has(i.id)).length;
  const total = DEFAULT_CHECKLIST.length;
  const pct = Math.round((done / total) * 100);

  const urgency =
    phase.phase === "upcoming" && phase.daysUntilStart > 14
      ? "relaxed"
      : phase.phase === "upcoming"
        ? "tight"
        : phase.phase === "imminent"
          ? "critical"
          : "done";

  return (
    <div className="border-border flex h-full min-h-0 w-full flex-col rounded-md border">
      <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            Pre-event checklist
          </span>
          <span className="text-muted-foreground text-[11px]">
            {done}/{total} complete ·{" "}
            <UrgencyLabel urgency={urgency} days={phase.daysUntilStart} />
          </span>
        </div>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {pct}%
        </span>
      </div>

      <ul className="divide-border flex min-h-0 flex-1 flex-col divide-y overflow-y-auto">
        {DEFAULT_CHECKLIST.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() =>
                  setChecked((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  })
                }
                className="hover:bg-muted/40 flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
              >
                <span
                  className={cn(
                    "border-border flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                    isChecked
                      ? "bg-foreground border-foreground"
                      : "bg-background",
                  )}
                  aria-hidden
                >
                  {isChecked && (
                    <CheckIcon className="text-background size-3" strokeWidth={3} />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isChecked && "text-muted-foreground line-through",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="text-muted-foreground truncate text-[11px]">
                    {item.hint}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UrgencyLabel({
  urgency,
  days,
}: {
  urgency: "relaxed" | "tight" | "critical" | "done";
  days: number;
}) {
  if (urgency === "done") return <span>event underway</span>;
  if (urgency === "critical")
    return (
      <span className="text-warning-foreground">
        {days <= 0 ? "due now" : `${days}d left`}
      </span>
    );
  if (urgency === "tight") return <span>{days}d left</span>;
  return <span>on track</span>;
}

/* ---------- Top schools panel (mock) ---------- */

type MockSchool = {
  name: string;
  dancers: number;
  activated: number;
};

const MOCK_TOP_SCHOOLS: MockSchool[] = [
  { name: "Alabama Crimson Tide", dancers: 42, activated: 38 },
  { name: "Louisiana State University", dancers: 36, activated: 29 },
  { name: "University of Texas", dancers: 31, activated: 22 },
  { name: "University of Oklahoma", dancers: 24, activated: 18 },
  { name: "Ohio State University", dancers: 19, activated: 11 },
];

function TopSchoolsPanel() {
  const maxCount = Math.max(...MOCK_TOP_SCHOOLS.map((s) => s.dancers));
  return (
    <div className="border-border flex flex-col rounded-md border">
      <div className="border-border bg-muted/40 flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            Top schools
          </span>
          <span className="text-muted-foreground text-[11px]">
            Dancers by organization · this event
          </span>
        </div>
        <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
          Mock
        </span>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-border border-b">
            <th className="text-muted-foreground px-3 py-1.5 text-left text-[10px] font-medium tracking-wide uppercase">
              Organization
            </th>
            <th className="text-muted-foreground w-12 px-3 py-1.5 text-right text-[10px] font-medium tracking-wide uppercase">
              Total
            </th>
            <th className="text-muted-foreground px-3 py-1.5 text-left text-[10px] font-medium tracking-wide uppercase">
              Activation
            </th>
          </tr>
        </thead>
        <tbody>
          {MOCK_TOP_SCHOOLS.map((school) => {
            const pct = Math.round((school.activated / school.dancers) * 100);
            const barPct = (school.dancers / maxCount) * 100;
            return (
              <tr
                key={school.name}
                className="border-border hover:bg-muted/30 border-b transition-colors last:border-b-0"
              >
                <td className="px-3 py-1.5 text-xs font-medium">
                  <span className="truncate">{school.name}</span>
                </td>
                <td className="px-3 py-1.5 text-right text-xs tabular-nums">
                  {school.dancers}
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="bg-muted relative h-1 flex-1 overflow-hidden rounded-full">
                      <div
                        className="bg-foreground/80 h-full"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-8 text-right text-[11px] tabular-nums">
                      {pct}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Right sidebar ---------- */

function EventSidebar({
  orgSlug,
  events,
  activeEvent,
  phase,
  stats,
  totalRoster,
}: {
  orgSlug: string;
  events: OrgEvent[];
  activeEvent: OrgEvent;
  phase: EventPhaseInfo;
  stats: CsvUploadSummary[];
  totalRoster: number;
}) {
  return (
    <aside className="border-border flex w-full shrink-0 flex-col border-t xl:w-[320px] xl:overflow-y-auto xl:border-t-0 xl:border-l">
      <SidebarEventSection
        orgSlug={orgSlug}
        events={events}
        activeEvent={activeEvent}
      />
      <SidebarPhaseSection phase={phase} totalRoster={totalRoster} />
      <SidebarDetailsSection event={activeEvent} />
      <SidebarActivitySection orgSlug={orgSlug} uploads={stats} />
    </aside>
  );
}

function SidebarSection({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="border-border border-b last:border-b-0">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          {title}
        </span>
        {action}
      </div>
      <div className="px-4 pb-3">{children}</div>
    </section>
  );
}

function SidebarEventSection({
  orgSlug,
  events,
  activeEvent,
}: {
  orgSlug: string;
  events: OrgEvent[];
  activeEvent: OrgEvent;
}) {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const byStart = b.startDate.localeCompare(a.startDate);
        if (byStart !== 0) return byStart;
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [events],
  );

  const items = sortedEvents.map((e) => ({
    value: e.id,
    label: e.name,
  }));

  const activate = useMutation({
    mutationFn: async (eventId: string) => {
      const raw = client as unknown as {
        PATCH: (
          path: string,
          opts: { body: { isActive: boolean } },
        ) => Promise<{ data: OrgEvent }>;
      };
      const res = await raw.PATCH(`/orgs/${orgSlug}/events/${eventId}`, {
        body: { isActive: true },
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries(adminQueries.events(orgSlug));
      toastManager.add({ title: "Active event updated", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Couldn't switch event", type: "error" });
    },
  });

  return (
    <>
      <SidebarSection
        title="Event"
        action={
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground hover:text-foreground -mr-1.5 gap-1 px-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="size-3" />
            New
          </Button>
        }
      >
        <Select
          items={items}
          value={activeEvent.id}
          onValueChange={(value) => {
            if (!value || value === activeEvent.id) return;
            activate.mutate(value);
          }}
          disabled={activate.isPending}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarSection>
      <EventFormSheet
        orgSlug={orgSlug}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}

function SidebarPhaseSection({
  phase,
  totalRoster,
}: {
  phase: EventPhaseInfo;
  totalRoster: number;
}) {
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
      ? `of ${phase.totalDays} · live now`
      : phase.phase === "wrapped"
        ? phase.label.toLowerCase()
        : phase.daysUntilStart === 1
          ? "until kickoff"
          : "until kickoff";

  return (
    <SidebarSection title="Countdown">
      <div className="flex items-baseline gap-2">
        {phase.phase === "live" && <LivePulse />}
        <span className="text-foreground text-2xl leading-none font-semibold tracking-tight tabular-nums">
          {headline}
        </span>
        <span className="text-muted-foreground text-[11px]">{subhead}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="bg-border relative h-1 flex-1 overflow-hidden">
          <div
            className="bg-foreground h-full"
            style={{ width: `${phaseProgressPct(phase)}%` }}
          />
        </div>
        <span className="text-muted-foreground text-[10px] tabular-nums">
          {totalRoster} on roster
        </span>
      </div>
    </SidebarSection>
  );
}

function phaseProgressPct(phase: EventPhaseInfo): number {
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

function SidebarDetailsSection({ event }: { event: OrgEvent }) {
  return (
    <SidebarSection title="Details">
      <ul className="flex flex-col gap-2 text-xs">
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
              href={event.schedulePdfUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand truncate"
            >
              View schedule PDF
            </a>
          </li>
        )}
      </ul>
    </SidebarSection>
  );
}

function SidebarActivitySection({
  orgSlug,
  uploads,
}: {
  orgSlug: string;
  uploads: CsvUploadSummary[];
}) {
  const recent = uploads.slice(0, 4);
  if (recent.length === 0) {
    return (
      <SidebarSection title="Recent activity">
        <p className="text-muted-foreground text-xs">No uploads yet.</p>
      </SidebarSection>
    );
  }
  return (
    <SidebarSection title="Recent activity">
      <ul className="flex flex-col gap-2">
        {recent.map((upload) => {
          const touched =
            (upload.rowsAdded ?? 0) + (upload.rowsUpdated ?? 0);
          return (
            <li key={upload.id} className="flex items-start gap-2 text-xs">
              <UploadIcon className="text-muted-foreground mt-0.5 size-3 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span>
                  <span className="font-medium tabular-nums">
                    {touched.toLocaleString()}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {upload.type === "dancer" ? "dancers" : "coaches"} uploaded
                  </span>
                </span>
                <span className="text-muted-foreground text-[10px]">
                  {formatDistanceToNow(new Date(upload.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <Link
        to="/$orgSlug/admin/uploads"
        params={{ orgSlug }}
        className="text-foreground hover:text-brand mt-3 inline-flex items-center gap-1 text-[11px] font-medium"
      >
        View all uploads
        <ArrowRightIcon className="size-3" />
      </Link>
    </SidebarSection>
  );
}

/* ---------- Date helpers ---------- */

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

function formatLongDateRange(startYmd: string, endYmd: string): string {
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

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function AdminHome() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const activeEvent = events?.find((e) => e.isActive);

  if (!activeEvent) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold">Create your first event</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            You'll be able to upload rosters once an event is active.
          </p>
        </div>
        <CreateEventForm orgSlug={orgSlug} />
      </div>
    );
  }

  return (
    <AdminDashboard
      orgSlug={orgSlug}
      events={events}
      activeEvent={activeEvent}
    />
  );
}
