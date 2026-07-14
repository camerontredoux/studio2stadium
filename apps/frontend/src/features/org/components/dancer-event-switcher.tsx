import { format, parseISO } from "date-fns";

import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MyRoster } from "@/features/org/context/org-context";

export function DancerEventSwitcher({
  rosters,
  value,
  onValueChange,
}: {
  rosters: MyRoster[];
  value: string;
  onValueChange: (eventId: string) => void;
}) {
  const items = rosters.map((roster) => ({
    value: roster.eventId,
    label: `${roster.eventName} · ${format(parseISO(roster.eventStartDate), "MMM d, yyyy")}`,
  }));

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(eventId) => {
        if (eventId) onValueChange(eventId);
      }}
    >
      <SelectTrigger
        size="sm"
        className="w-full min-w-52 sm:w-auto"
        aria-label="View event"
      >
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
  );
}
