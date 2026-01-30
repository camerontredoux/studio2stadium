import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon } from "lucide-react";
import { type Event, EventCard } from "./components/event-card";
import { EventsFilterSheet } from "./components/filters/filter-sheet";
import { MOCK_EVENTS } from "./components/mock-data";

function groupEventsByMonth(events: Event[]) {
  const groups: { month: string; events: Event[] }[] = [];
  for (const event of events) {
    const month = event.date.replace(/\s\d{1,2},/, "");
    const last = groups[groups.length - 1];
    if (last?.month === month) {
      last.events.push(event);
    } else {
      groups.push({ month, events: [event] });
    }
  }
  return groups;
}

export function Page() {
  const grouped = groupEventsByMonth(MOCK_EVENTS);

  return (
    <div className="flex pt-1 sm:pt-0 flex-col gap-2 lg:gap-4 max-lg:pb-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex flex-col gap-0.5 max-sm:pl-1">
          <div className="flex items-end gap-2">
            <h1 className="text-2xl font-bold tracking-tight leading-none">
              Events
            </h1>
            <Badge variant="brand" className="gap-1">
              {MOCK_EVENTS.length} upcoming
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Showcases, auditions, workshops & more
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 lg:gap-4">
        {grouped.map((group) => (
          <section
            key={group.month}
            className="flex flex-col gap-2 lg:gap-3 relative"
          >
            <div className="sticky top-12 z-10 py-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-brand/20 bg-background/90 backdrop-blur-sm px-2.5 py-1">
                  <CalendarIcon className="size-3.5 text-brand" />
                  <span className="text-sm font-semibold text-brand">
                    {group.month}
                  </span>
                </div>
              </div>
            </div>
            <Separator className="flex-1 -z-10 absolute top-6 left-0" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
              {group.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            <div className="absolute right-0 z-20 bg-background top-2">
              <EventsFilterSheet />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
