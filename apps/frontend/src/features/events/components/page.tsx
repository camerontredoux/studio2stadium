import { Separator } from "@/components/ui/separator";
import { CalendarIcon } from "lucide-react";
import { type Event, EventCard } from "./event-card";
import { FilterSheet } from "./filters/filter-sheet";

const MOCK_EVENTS: Event[] = [
  {
    id: "1",
    title: "Spring Showcase: Contemporary & Modern",
    tag: "Showcase",
    image:
      "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=600&h=400&fit=crop",
    location: "USC Kaufman Hall, Los Angeles, CA",
    date: "Feb 14, 2026",
    time: "7:00 PM",
    attendees: 142,
  },
  {
    id: "2",
    title: "Hip Hop Intensive Workshop",
    tag: "Workshop",
    image:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&h=400&fit=crop",
    location: "Juilliard Studios, New York, NY",
    date: "Feb 18, 2026",
    time: "2:00 PM",
    attendees: 56,
  },
  {
    id: "3",
    title: "Audition Day: Fall 2026 Admissions",
    tag: "Audition",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    location: "NYU Tisch School of the Arts, New York, NY",
    date: "Feb 22, 2026",
    time: "9:00 AM",
    attendees: 230,
  },
  {
    id: "4",
    title: "Ballet Masterclass with Guest Artist",
    tag: "Masterclass",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=600&h=400&fit=crop",
    location: "UNC School of the Arts, Winston-Salem, NC",
    date: "Mar 1, 2026",
    time: "10:00 AM",
    attendees: 78,
  },
  {
    id: "5",
    title: "Jazz & Musical Theater Showcase",
    tag: "Showcase",
    image:
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&h=400&fit=crop",
    location: "Point Park University, Pittsburgh, PA",
    date: "Mar 7, 2026",
    time: "6:30 PM",
    attendees: 95,
  },
  {
    id: "6",
    title: "World Dance Festival",
    tag: "Festival",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    location: "UCLA, Los Angeles, CA",
    date: "Mar 14, 2026",
    time: "12:00 PM",
    attendees: 310,
  },
  {
    id: "7",
    title: "Choreography Competition Finals",
    tag: "Competition",
    image:
      "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&h=400&fit=crop",
    location: "Fordham / Ailey, New York, NY",
    date: "Mar 21, 2026",
    time: "5:00 PM",
    attendees: 185,
  },
  {
    id: "8",
    title: "Open House & Campus Tour",
    tag: "Open House",
    image:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop",
    location: "Butler University, Indianapolis, IN",
    date: "Mar 28, 2026",
    time: "11:00 AM",
    attendees: 64,
  },
];

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
    <div className="flex flex-col gap-2 lg:gap-4 max-lg:pb-14">
      <div className="flex items-center justify-between">
        <div className="max-sm:pl-1">
          <h1 className="text-xl sm:text-2xl font-bold">Events</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Upcoming showcases, auditions & more
          </p>
        </div>
        <FilterSheet />
      </div>

      <p className="text-sm text-muted-foreground max-sm:pl-1">
        {MOCK_EVENTS.length} upcoming events
      </p>

      <div className="flex flex-col gap-4 lg:gap-6">
        {grouped.map((group) => (
          <section key={group.month} className="flex flex-col gap-2 lg:gap-3">
            <div className="sticky top-12 z-10 py-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-brand/20 bg-background/90 backdrop-blur-sm px-2.5 py-1">
                  <CalendarIcon className="size-3.5 text-brand" />
                  <span className="text-sm font-semibold text-brand">
                    {group.month}
                  </span>
                </div>
                <Separator className="flex-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
              {group.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
