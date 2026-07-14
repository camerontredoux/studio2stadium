import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { CalendarClockIcon } from "lucide-react";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export function EventAccessBanner({
  eventName,
  startDate,
  children,
  action,
}: {
  eventName: string;
  startDate: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const formattedStartDate = format(parseISO(startDate), "MMMM d, yyyy");

  return (
    <Alert variant="info" className="rounded-none border-x-0 px-4 py-4">
      <CalendarClockIcon />
      <AlertTitle>
        You’re registered for {eventName} on {formattedStartDate}
      </AlertTitle>
      <AlertDescription>{children}</AlertDescription>
      {action && <AlertAction>{action}</AlertAction>}
    </Alert>
  );
}
