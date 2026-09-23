import { CalendarOffIcon } from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import { ActivateEventDialog } from "@/features/org/components/activate-event-dialog";

/**
 * Tells an Organizer their event is not active yet, and offers the two steps:
 * review its details in the event form, then activate it.
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
    <Alert variant="warning" className="rounded-none border-x-0 px-4 py-4">
      <CalendarOffIcon />
      <AlertTitle>Your event “{event.name}” isn’t active yet</AlertTitle>
      <AlertDescription>
        Dancers and coaches can’t see it until it is. Review its details, then
        activate it.
      </AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={onReview}>
          Review details
        </Button>
        <ActivateEventDialog
          orgSlug={orgSlug}
          event={event}
          trigger={<Button size="sm" />}
        >
          Activate event
        </ActivateEventDialog>
      </AlertAction>
    </Alert>
  );
}
