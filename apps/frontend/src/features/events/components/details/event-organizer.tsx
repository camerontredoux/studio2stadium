import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Link } from "@tanstack/react-router";
import type { ApiEvent } from "../../types";

interface EventOrganizerProps {
  organizer: NonNullable<ApiEvent["organizer"]>;
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
            render={
              <Link
                to="/explore/$username"
                params={{ username: organizer.username }}
              />
            }
          >
            View Profile
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        <div className="flex items-start gap-3">
          <div className="flex flex-col overflow-hidden">
            <h3
              title={organizer?.name}
              aria-label={organizer?.name}
              className="truncate font-medium max-sm:text-sm"
            >
              {organizer?.name}
            </h3>
            <span className="text-muted-foreground text-xs">
              Hosting x other events
            </span>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}
