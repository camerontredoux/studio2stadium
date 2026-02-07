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
          className="relative flex flex-col gap-2 lg:gap-3"
        >
          <div className="sticky top-12 z-10 py-2">
            <div className="flex items-center gap-2">
              <div className="border-brand/20 bg-background/90 flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-sm">
                <CalendarIcon className="text-brand size-3.5" />
                <span className="text-brand text-sm font-semibold">
                  {group.month}
                </span>
              </div>
            </div>
          </div>
          <Separator className="absolute top-6 left-0 -z-10 flex-1" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
            {group.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="bg-background absolute top-2 right-0 z-20">
            <EventsFilterSheet />
          </div>
        </section>
      ))}
    </div>
  );
}
