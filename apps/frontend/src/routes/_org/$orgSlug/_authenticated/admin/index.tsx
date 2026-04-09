import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { UploadIcon, UsersIcon, UserCheckIcon, UserXIcon } from "lucide-react";

import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { EventHero } from "@/features/org/components/event-hero";
import { StatCard } from "@/features/org/components/stat-card";
import { CsvUploadTriggerCard } from "@/features/org/components/csv-upload-trigger-card";
import {
  CreateEventForm,
  EventFormSheet,
} from "@/features/org/components/event-form-sheet";
import { OrgEventSwitcher } from "@/features/org/components/org-event-switcher";
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
  const { openPalette } = useAdminCommands();

  useAdminCommandListener(
    (a) => a.type === "open-edit-event",
    () => setEditOpen(true),
  );

  const totalRoster = stats.coaches + stats.dancers;
  const lastUpload = stats.recentUploads[0] ?? null;
  const lastUploadLabel = lastUpload
    ? `${formatDistanceToNow(new Date(lastUpload.createdAt), { addSuffix: true })}`
    : "No uploads yet";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <OrgEventSwitcher
        orgSlug={orgSlug}
        events={events}
        activeEvent={activeEvent}
      />
      <EventHero
        event={activeEvent}
        registered={stats.registered}
        total={totalRoster}
        onEditEvent={() => setEditOpen(true)}
        onOpenCommand={openPalette}
      />

      <section
        aria-label="Event stats"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <StatCard
          label="Dancers"
          value={stats.dancers.toLocaleString()}
          subtitle="on roster"
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Coaches"
          value={stats.coaches.toLocaleString()}
          subtitle="on roster"
          icon={<UsersIcon className="size-4" />}
        />
        <StatCard
          label="Pending"
          value={stats.pending.toLocaleString()}
          subtitle="not yet active"
          icon={<UserXIcon className="size-4" />}
          tone={stats.pending > 0 ? "accent" : "default"}
        />
        <StatCard
          label="Active"
          value={stats.registered.toLocaleString()}
          subtitle={lastUploadLabel}
          icon={<UserCheckIcon className="size-4" />}
        />
      </section>

      <section
        aria-label="Roster uploads"
        className="grid gap-4 md:grid-cols-2"
      >
        <CsvUploadTriggerCard
          orgSlug={orgSlug}
          eventId={activeEvent.id}
          type="dancer"
          icon={<UploadIcon className="size-4" />}
          lastUpload={stats.recentUploads.find((u) => u.type === "dancer") ?? null}
        />
        <CsvUploadTriggerCard
          orgSlug={orgSlug}
          eventId={activeEvent.id}
          type="coach"
          icon={<UploadIcon className="size-4" />}
          lastUpload={stats.recentUploads.find((u) => u.type === "coach") ?? null}
        />
      </section>

      <EventFormSheet
        orgSlug={orgSlug}
        event={activeEvent}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}

function AdminHome() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const activeEvent = events?.find((e) => e.isActive);

  if (!activeEvent) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="text-center">
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
