import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast-manager";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { EventFormSheet } from "@/features/org/components/event-form-sheet";
import { client } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function sortEventsForPicker(events: OrgEvent[]): OrgEvent[] {
  return [...events].sort((a, b) => {
    const byStart = b.startDate.localeCompare(a.startDate);
    if (byStart !== 0) return byStart;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function eventOptionLabel(e: OrgEvent): string {
  const start = parseYmd(e.startDate);
  return `${e.name} · ${format(start, "MMM d, yyyy")}`;
}

export function OrgEventSwitcher({
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

  const sorted = sortEventsForPicker(events);
  const selectItems = sorted.map((e) => ({
    value: e.id,
    label: eventOptionLabel(e),
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
      toastManager.add({
        title: "Couldn't switch event",
        type: "error",
      });
    },
  });

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="org-active-event">Active event</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <Select
              items={selectItems}
              value={activeEvent.id}
              onValueChange={(value) => {
                if (!value || value === activeEvent.id) return;
                activate.mutate(value);
              }}
              disabled={activate.isPending}
            >
              <SelectTrigger id="org-active-event" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full shrink-0 gap-1.5 sm:w-auto"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="size-4" aria-hidden />
            New event
          </Button>
        </div>
      </div>

      <EventFormSheet
        orgSlug={orgSlug}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}
