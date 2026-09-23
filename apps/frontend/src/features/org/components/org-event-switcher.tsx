import { CheckIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivateEventDialog } from "@/features/org/components/activate-event-dialog";
import { EventFormSheet } from "@/features/org/components/event-form-sheet";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOrg } from "@/features/org/context/use-org";
import {
  BUY_ANOTHER_EVENT_MESSAGE,
  canCreateOrgEvent,
  eventTierLabel,
} from "@/lib/event-tiers";
import { useSession } from "@/lib/session";

export function OrgEventSwitcher({ orgSlug }: { orgSlug: string }) {
  const { activeEvent, events, selectedEvent, selectEvent } = useAdminEvent();
  const [createOpen, setCreateOpen] = useState(false);
  const org = useOrg();
  const canCreate = canCreateOrgEvent({
    session: useSession(),
    orgSelfServe: org.selfServe,
    orgTierManaged: org.tierManaged,
  });

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
                  <span className="text-muted-foreground flex shrink-0 gap-2 text-[10px] font-medium tracking-wide uppercase">
                    <span>{eventTierLabel(event.eventTier)}</span>
                    {event.isActive && <span>Active</span>}
                  </span>
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
          <ActivateEventDialog
            orgSlug={orgSlug}
            event={selectedEvent}
            trigger={
              <Button
                size="xs"
                className="h-8 px-2.5"
                disabled={!selectedEvent}
              />
            }
          >
            Make active
          </ActivateEventDialog>
        )}

        {canCreate ? (
          <Button
            variant="ghost"
            size="xs"
            className="h-8 gap-1 px-2"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon aria-hidden className="size-3" />
            New
          </Button>
        ) : (
          <TooltipProvider delay={0}>
            <Tooltip>
              <TooltipTrigger render={<span tabIndex={0} />}>
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-8 gap-1 px-2"
                  disabled
                  aria-label={`New event. ${BUY_ANOTHER_EVENT_MESSAGE}`}
                >
                  <PlusIcon aria-hidden className="size-3" />
                  New
                </Button>
              </TooltipTrigger>
              <TooltipPopup>{BUY_ANOTHER_EVENT_MESSAGE}</TooltipPopup>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {canCreate && (
        <EventFormSheet
          orgSlug={orgSlug}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
    </>
  );
}
