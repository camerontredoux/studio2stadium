import { format, parseISO } from "date-fns";
import { CalendarClockIcon, SearchIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function CoachEventAccessBanner({
  orgSlug,
  eventName,
  startDate,
}: {
  orgSlug: string;
  eventName: string;
  startDate: string;
}) {
  const formattedStartDate = format(parseISO(startDate), "MMMM d, yyyy");

  return (
    <Alert variant="info" className="rounded-none border-x-0 px-4 py-4">
      <CalendarClockIcon />
      <AlertTitle>
        You’re registered for {eventName} on {formattedStartDate}
      </AlertTitle>
      <AlertDescription>
        Ratings, favorites, notes, and callbacks unlock during your event. You
        can browse dancers from every event now.
      </AlertDescription>
      <AlertAction>
        <Button
          variant="outline"
          render={<Link to="/o/$orgSlug/coach/dancers" params={{ orgSlug }} />}
        >
          <SearchIcon />
          Browse all dancers
        </Button>
      </AlertAction>
    </Alert>
  );
}
