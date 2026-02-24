import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import type { ApiSchemas } from "@/lib/api/client";
import { TrophyIcon } from "lucide-react";

type Events = ApiSchemas["DancersIdResponse"]["events"];

export function Events({ events }: { events: Events }) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Events Attending</FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        {events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.id}
              className="hover:bg-accent/50 flex flex-col gap-1 px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <TrophyIcon className="size-4 shrink-0" />
                <span className="text-sm">{event.title}</span>
              </div>
              <span className="text-muted-foreground text-sm">
                {event.location}
              </span>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground p-4 text-sm">
            No events attending
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
