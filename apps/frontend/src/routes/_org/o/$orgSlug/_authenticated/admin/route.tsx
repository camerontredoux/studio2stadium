import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toastManager } from "@/components/ui/toast-manager";
import { AdminSidebar } from "@/features/org/components/admin-sidebar";
import { AdminCommandPalette } from "@/features/org/components/admin-command-palette";
import { AdminCommandsProvider } from "@/features/org/hooks/use-admin-commands";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { EventFormSheet } from "@/features/org/components/event-form-sheet";
import { orgQueries } from "@/features/org/api/queries";
import { client } from "@/lib/api/client";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_org/o/$orgSlug/_authenticated/admin")({
  beforeLoad: async ({ context, params }) => {
    const data = (await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    )) as { membership?: { role: string; type: string } | null } | null;
    const role = data?.membership?.role;
    if (role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const activeEvent = events.find((event) => event.isActive);

  return (
    <AdminCommandsProvider>
      <SidebarProvider className="h-svh">
        <AdminSidebar />
        <SidebarInset className="overflow-hidden">
          <header className="bg-sidebar text-sidebar-foreground flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-muted-foreground text-sm font-medium 2xl:text-base">
              Admin
            </span>
            <div className="ml-auto">
              <AdminEventSwitcher
                orgSlug={orgSlug}
                events={events}
                activeEventId={activeEvent?.id}
              />
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </SidebarInset>
        <AdminCommandPalette />
      </SidebarProvider>
    </AdminCommandsProvider>
  );
}

function AdminEventSwitcher({
  orgSlug,
  events,
  activeEventId,
}: {
  orgSlug: string;
  events: OrgEvent[];
  activeEventId?: string;
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

  const items = sortedEvents.map((event) => ({
    value: event.id,
    label: event.name,
  }));

  const activate = useMutation({
    mutationFn: async (eventId: string) => {
      const raw = client as unknown as {
        PATCH: (
          path: string,
          opts: { body: { isActive: boolean } },
        ) => Promise<{ data: OrgEvent }>;
      };
      const response = await raw.PATCH(`/orgs/${orgSlug}/events/${eventId}`, {
        body: { isActive: true },
      });
      return response.data;
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
      <div className="flex items-center gap-2">
        <Select
          items={items}
          value={activeEventId}
          onValueChange={(value) => {
            if (!value || value === activeEventId) return;
            activate.mutate(value);
          }}
          disabled={activate.isPending || items.length === 0}
        >
          <SelectTrigger className="h-8 w-[220px] bg-background text-xs 2xl:text-sm">
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="xs"
          className="h-8 gap-1 px-2"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon className="size-3" />
          New
        </Button>
      </div>
      <EventFormSheet
        orgSlug={orgSlug}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}
