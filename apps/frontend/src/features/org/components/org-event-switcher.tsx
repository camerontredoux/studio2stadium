import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { client } from "@/lib/api/client";

export function OrgEventSwitcher({ orgSlug }: { orgSlug: string }) {
  const queryClient = useQueryClient();
  const { activeEvent, events, selectedEvent, selectEvent } = useAdminEvent();
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
          options: { body: { isActive: boolean } },
        ) => Promise<{ data: OrgEvent; error?: unknown }>;
      };
      const response = await raw.PATCH(`/orgs/${orgSlug}/events/${eventId}`, {
        body: { isActive: true },
      });
      if (response.error) throw new Error("Activation failed");
      return response.data;
    },
    onSuccess: () => {
      setConfirmOpen(false);
      void queryClient.invalidateQueries(adminQueries.events(orgSlug));
      toastManager.add({ title: "Active event updated", type: "success" });
    },
    onError: () => {
      toastManager.add({
        title: "Couldn't make event active",
        type: "error",
      });
    },
  });

  const isSelectedActive =
    selectedEvent !== null && selectedEvent.id === activeEvent?.id;

  return (
    <>
      <div className="flex items-center gap-2">
        <Select
          items={items}
          value={selectedEvent?.id ?? null}
          onValueChange={(value) => {
            if (value) selectEvent(value);
          }}
          disabled={items.length === 0}
        >
          <SelectTrigger
            aria-label="Event to view"
            className="bg-background h-8 w-[220px] text-xs 2xl:text-sm"
          >
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            {sortedEvents.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                <span className="flex min-w-0 items-center justify-between gap-3">
                  <span className="truncate">{event.name}</span>
                  {event.isActive && (
                    <span className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                      Active
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isSelectedActive ? (
          <Button
            variant="outline"
            size="xs"
            className="h-8 gap-1.5 px-2.5"
            disabled
          >
            <CheckIcon aria-hidden className="size-3" />
            Active event
          </Button>
        ) : (
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  size="xs"
                  className="h-8 px-2.5"
                  disabled={!selectedEvent}
                />
              }
            >
              Make active
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Make {selectedEvent?.name} the active event?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Dancers and coaches will see this as the active event. If
                  another event is active, it will no longer be shown to them.
                  Admins can still view any event from the event switcher.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose
                  render={
                    <Button variant="ghost" disabled={activate.isPending} />
                  }
                >
                  Cancel
                </AlertDialogClose>
                <Button
                  onClick={() => {
                    if (selectedEvent) activate.mutate(selectedEvent.id);
                  }}
                  disabled={!selectedEvent || activate.isPending}
                >
                  {activate.isPending ? "Making active…" : "Make active"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button
          variant="ghost"
          size="xs"
          className="h-8 gap-1 px-2"
          onClick={() => setCreateOpen(true)}
        >
          <PlusIcon aria-hidden className="size-3" />
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
