import { useSuspenseQuery } from "@tanstack/react-query";
import { queries } from "../../api/queries";
import { CalendarIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EventCard } from "./event-card";
import { EventsFilterSheet } from "../filters/filter-sheet";

export function EventList() {
  const { data } = useSuspenseQuery(queries.events());

  return (
    <div className="flex flex-col gap-2 lg:gap-4">
      {data.map((group) => (
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
  );
}
