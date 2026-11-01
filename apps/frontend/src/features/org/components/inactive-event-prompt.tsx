import { CalendarXIcon } from "@phosphor-icons/react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Panel, PanelHead } from "@/components/event/panel";
import { Tag } from "@/components/event/tag";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import { ActivateEventDialog } from "@/features/org/components/activate-event-dialog";

/**
 * Tells an Organizer their event is not active yet, and offers the two steps:
 * review its details in the event form, then activate it. A dashboard panel
 * with the amber tint the old warning banner had.
 */
export function InactiveEventPrompt({
  orgSlug,
  event,
  onReview,
}: {
  orgSlug: string;
  event: Pick<OrgEvent, "id" | "name">;
  onReview: () => void;
}) {
  return (
    <Panel aria-label="Event activation" className="border-amber/32 bg-amber/4">
      <PanelHead label="Event status">
        <Tag className="text-amber">
          <Icon icon={CalendarXIcon} />
          Inactive
        </Tag>
      </PanelHead>
      <div className="flex flex-wrap items-center gap-x-(--space-16) gap-y-(--space-12) p-(--space-14)">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-(--space-4)">
          <h2 className="text-fg m-0 text-[13px] leading-[1.4] font-semibold">
            Your event “{event.name}” isn’t active yet
          </h2>
          <p className="text-fg-2 m-0 text-[13px] leading-[1.5]">
            Dancers and coaches can’t see it until it is. Review its details,
            then activate it.
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-(--space-6)">
          <Button onClick={onReview}>Review details</Button>
          <ActivateEventDialog
            orgSlug={orgSlug}
            event={event}
            trigger={<Button variant="primary" />}
          >
            Activate event
          </ActivateEventDialog>
        </div>
      </div>
    </Panel>
  );
}
