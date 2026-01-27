import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, MapPinIcon } from "lucide-react";

interface Event {
  title: string;
  type: string;
  description: string;
  date: string;
  time: string;
  location: string;
}

export function UpcomingEvent({ event: _ }: { event?: Event }) {
  return (
    <div className="px-5 py-4 hover:bg-accent">
      <div className="flex items-center gap-3">
        <Avatar className="size-12 rounded-xl self-start">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            Event Title <Badge variant="success">Type</Badge>
          </h3>
          <p className="text-xs text-muted-foreground">USC Kaufman</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="size-3" /> Oct 28
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPinIcon className="size-3" /> Oct 28
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
