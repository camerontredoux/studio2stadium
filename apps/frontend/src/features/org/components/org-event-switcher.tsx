import { PlusIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/event/menu";
import { ShellSidebarBrand } from "@/components/event/shell";
import { Tag } from "@/components/event/tag";
import { toastManager } from "@/components/ui/toast-manager";
import {
  invalidateAfterLiveEventChange,
  type OrgEvent,
} from "@/features/org/api/admin-queries";
import { EventFormSheet } from "@/features/org/components/event-form-sheet";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { useOrg } from "@/features/org/context/use-org";
import { monogram } from "@/features/org/live/shared/monogram";
import { $api } from "@/lib/api/client";

/**
 * The admin event switcher: the sidebar brand (monogram + org name) opening an
 * "Events" menu. Picking an event shows it in the admin area; the live event
 * is tagged LIVE and any other can be made live (PATCH `isActive: true`,
 * after a confirm). "New event" opens the event form.
 */
export function OrgEventSwitcher({ orgSlug }: { orgSlug: string }) {
  const queryClient = useQueryClient();
  const { org } = useOrg();
  const { events, selectedEvent, selectEvent } = useAdminEvent();
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmEvent, setConfirmEvent] = useState<OrgEvent | null>(null);
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

  const activate = $api.useMutation("patch", "/orgs/{slug}/events/{id}", {
    onSuccess: (_data, { params }) => {
      setConfirmOpen(false);
      // Show the event that just went live.
      selectEvent(params.path.id);
      void invalidateAfterLiveEventChange(queryClient);
      toastManager.add({ title: "Live event updated", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Couldn't make event live", type: "error" });
    },
  });

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <ShellSidebarBrand
              mark={monogram(org.name)}
              name={org.name}
              aria-label={`${org.name}: switch event`}
            />
          }
        />
        <MenuPopup align="start" className="w-[300px] max-w-[calc(100vw-16px)]">
          <MenuGroup>
            <MenuGroupLabel>Events</MenuGroupLabel>
            {sortedEvents.length === 0 ? (
              <p className="type-body text-fg-3 m-0 px-(--space-8) py-(--space-6)">
                No events yet
              </p>
            ) : (
              <MenuRadioGroup
                value={selectedEvent?.id ?? ""}
                onValueChange={(eventId: string) => selectEvent(eventId)}
              >
                {sortedEvents.map((event) => (
                  <MenuRadioItem
                    key={event.id}
                    value={event.id}
                    indicator="start"
                    closeOnClick
                    className="h-9"
                  >
                    <span className="flex min-w-0 items-center gap-(--space-8)">
                      <span
                        className={
                          event.id === selectedEvent?.id
                            ? "text-fg min-w-0 truncate font-medium"
                            : "text-fg-2 min-w-0 truncate font-medium"
                        }
                      >
                        {event.name}
                      </span>
                      <span className="ms-auto flex shrink-0 items-center">
                        {event.isActive ? (
                          <Tag tone="live">Live</Tag>
                        ) : (
                          <Button
                            size="sm"
                            className="text-[11.5px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setConfirmEvent(event);
                              setConfirmOpen(true);
                            }}
                          >
                            Make live
                          </Button>
                        )}
                      </span>
                    </span>
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            )}
          </MenuGroup>
          <MenuSeparator />
          <MenuItem icon={PlusIcon} onClick={() => setCreateOpen(true)}>
            New event
          </MenuItem>
        </MenuPopup>
      </Menu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Make {confirmEvent?.name} live?</DialogTitle>
          </DialogHeader>
          <DialogBody className="pt-(--space-8)">
            <DialogDescription>
              Dancers and coaches will see this as the live event. If another
              event is live, they won't see it anymore. Admins can still open
              any event from this menu.
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="lg"
                  disabled={activate.isPending}
                />
              }
            >
              Cancel
            </DialogClose>
            <Button
              variant="primary"
              size="lg"
              disabled={!confirmEvent || activate.isPending}
              onClick={() => {
                if (!confirmEvent) return;
                activate.mutate({
                  params: { path: { slug: orgSlug, id: confirmEvent.id } },
                  body: { isActive: true },
                });
              }}
            >
              {activate.isPending ? "Making live…" : "Make live"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <EventFormSheet
        orgSlug={orgSlug}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}
