import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Link } from "@tanstack/react-router";
import type { EventDetail } from "../mock-data";

interface EventOrganizerProps {
  organizer: EventDetail["organizer"];
}

export function EventOrganizer({ organizer }: EventOrganizerProps) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Organizer
          <Button
            className="ml-auto"
            size="xs"
            variant="outline"
            render={<Link to="/events" />}
          >
            View Profile
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        <div className="flex items-center gap-3">
          <Avatar className="size-10 rounded-xl">
            <AvatarImage src={organizer.avatar} />
            <AvatarFallback>
              {organizer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{organizer.name}</span>
            <span className="text-muted-foreground text-xs">
              {organizer.role}
            </span>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}
