import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useSetEventCapabilityOverrides } from "@/features/admin/api/mutations";
import { adminQueries } from "@/features/admin/api/queries";
import { eventTierLabel } from "@/lib/event-tiers";
import { useQuery } from "@tanstack/react-query";

import {
  capabilityLabel,
  defaultChoiceLabel,
  EXCEPTION_CHOICES,
  leftoverOrgOverrides,
  overrideChoice,
  overridesWithChoice,
  type CapabilityResolution,
  type EventCapabilities,
  type OverrideChoice,
} from "../capability-overrides";

/**
 * What each of an Org's events includes, per capability: its Event Tier's
 * default, or an exception staff set on that event (#109). Each change saves
 * straight away and touches that one event only.
 */
export function EventCapabilitiesPanel({
  orgId,
  orgFeatures,
}: {
  orgId: string;
  /** The Org's `features`, for flags left over from before #109. */
  orgFeatures: Record<string, unknown>;
}) {
  const { data: events, isLoading } = useQuery(
    adminQueries.orgEventCapabilities(orgId),
  );

  if (isLoading) return <Spinner label="Loading events…" />;
  if (!events || events.length === 0) {
    return <NoEventsYet leftovers={leftoverOrgOverrides(orgFeatures)} />;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <EventCapabilitiesCard key={event.id} orgId={orgId} event={event} />
      ))}
    </div>
  );
}

/**
 * An Org with no event yet. A hand-built Org may still carry capability flags
 * from before they moved onto the Org Event; its first event starts with them
 * as exceptions, so they are shown read-only here.
 */
function NoEventsYet({
  leftovers,
}: {
  leftovers: ReturnType<typeof leftoverOrgOverrides>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">
        This organization has no events yet. Capabilities are set per event,
        once one exists.
      </p>
      {leftovers.length > 0 && (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">
            Its first event will start with these exceptions:
          </p>
          <div className="flex flex-wrap gap-2">
            {leftovers.map(({ capability, on }) => (
              <Badge key={capability} variant="warning">
                {capabilityLabel(capability).label}: {on ? "on" : "off"}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventCapabilitiesCard({
  orgId,
  event,
}: {
  orgId: string;
  event: EventCapabilities;
}) {
  const { mutate: setOverrides, isPending } =
    useSetEventCapabilityOverrides(orgId);

  const choose = (resolution: CapabilityResolution, choice: OverrideChoice) => {
    setOverrides(
      {
        params: { path: { id: orgId, eventId: event.id } },
        body: {
          capabilityOverrides: overridesWithChoice(
            event.capabilities,
            resolution.capability,
            choice,
          ),
        },
      },
      {
        onError: () => {
          toastManager.add({
            title: "Error",
            description: `Failed to update ${event.name}`,
            type: "error",
          });
        },
      },
    );
  };

  return (
    <section className="border-border space-y-3 rounded-lg border p-3">
      <header className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{event.name}</p>
        <Badge variant="outline">{eventTierLabel(event.eventTier)}</Badge>
        {event.isActive && <Badge variant="success">Active</Badge>}
      </header>
      {event.capabilities.map((resolution) => (
        <CapabilityRow
          key={resolution.capability}
          resolution={resolution}
          disabled={isPending}
          onChoose={(choice) => choose(resolution, choice)}
        />
      ))}
    </section>
  );
}

function CapabilityRow({
  resolution,
  disabled,
  onChoose,
}: {
  resolution: CapabilityResolution;
  disabled: boolean;
  onChoose: (choice: OverrideChoice) => void;
}) {
  const { label, description } = capabilityLabel(resolution.capability);
  const items = [
    { value: "default" as const, label: defaultChoiceLabel(resolution) },
    ...EXCEPTION_CHOICES,
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="space-y-0.5">
        <p className="flex items-center gap-2 text-sm">
          {label}
          {resolution.override === null ? (
            <Badge variant="secondary">Event Tier</Badge>
          ) : (
            <Badge variant="warning">Exception</Badge>
          )}
        </p>
        <p className="text-muted-foreground text-xs">
          {description} · {resolution.included ? "Included" : "Not included"}
        </p>
      </div>
      <Select
        items={items}
        value={overrideChoice(resolution)}
        disabled={disabled}
        onValueChange={(value) => {
          if (value) onChoose(value as OverrideChoice);
        }}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  );
}
