import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast-manager";
import { useSetOrgEventTier } from "@/features/admin/api/mutations";
import {
  EVENT_TIER_OPTIONS,
  eventTierLabel,
  type EventTier,
} from "@/lib/event-tiers";
import { useState } from "react";

import type { EventTierPurchase } from "../lib";

interface ChangeEventTierDialogProps {
  purchase: EventTierPurchase | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Sets the Event Tier of the Org Event a purchase bought. Changes that one
 * event's entitlement only; the purchase keeps the tier that was sold.
 */
export function ChangeEventTierDialog({
  purchase,
  onOpenChange,
}: ChangeEventTierDialogProps) {
  return (
    <Dialog open={!!purchase} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {purchase && (
          // Keyed so the chosen tier resets to the event's current one each
          // time the dialog opens for a purchase.
          <ChangeEventTierForm
            key={purchase.id}
            purchase={purchase}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChangeEventTierForm({
  purchase,
  onDone,
}: {
  purchase: EventTierPurchase;
  onDone: () => void;
}) {
  const { mutate: setEventTier, isPending } = useSetOrgEventTier();
  const [eventTier, setEventTierValue] = useState<EventTier>(
    purchase.event.eventTier,
  );
  const unchanged = eventTier === purchase.event.eventTier;

  const save = () => {
    setEventTier(
      {
        params: { path: { slug: purchase.org.slug, id: purchase.event.id } },
        body: { eventTier },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Event Tier changed",
            description: `${purchase.event.name} is now ${eventTierLabel(eventTier)}`,
            type: "success",
          });
          onDone();
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to change the Event Tier",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change Event Tier</DialogTitle>
        <DialogDescription>
          {purchase.event.name} · {purchase.org.name}
        </DialogDescription>
      </DialogHeader>
      <DialogPanel className="space-y-3">
        <Field>
          <FieldLabel>Event Tier</FieldLabel>
          <Select
            items={EVENT_TIER_OPTIONS}
            value={eventTier}
            onValueChange={(value) => {
              if (value) setEventTierValue(value as EventTier);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose the Event Tier" />
            </SelectTrigger>
            <SelectPopup>
              {EVENT_TIER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </Field>
        <p className="text-muted-foreground text-xs">
          Bought at {eventTierLabel(purchase.eventTier)}. This changes what this
          event includes, and no other event. The change is recorded under your
          name.
        </p>
      </DialogPanel>
      <DialogFooter>
        <Button disabled={isPending || unchanged} onClick={save}>
          {isPending ? "Saving..." : "Save Event Tier"}
        </Button>
      </DialogFooter>
    </>
  );
}
