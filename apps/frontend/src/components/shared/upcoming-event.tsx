import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon } from "lucide-react";

export interface UpcomingEventData {
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  organizer: {
    name: string;
    thumbnail: string | null;
  };
}

interface UpcomingEventProps {
  event: UpcomingEventData;
}

export function UpcomingEvent({ event }: UpcomingEventProps) {
  return (
    <div className="hover:bg-accent px-5 py-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-12 self-start rounded-xl">
          <AvatarImage src={event.organizer.thumbnail ?? undefined} />
          <AvatarFallback className="rounded-xl">
            {event.organizer.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Badge variant="brand" className="shrink-0 capitalize">
              {event.type}
            </Badge>
            <span className="truncate">{event.title}</span>
          </h3>
          <p className="text-muted-foreground truncate text-xs">
            {event.organizer.name}
          </p>
          <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
            <div className="flex shrink-0 items-center gap-1">
              <CalendarIcon className="text-brand size-3" /> {event.date}
            </div>
            <span>&middot;</span>
            <div className="flex min-w-0 items-center gap-1">
              <MapPinIcon className="text-brand size-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
