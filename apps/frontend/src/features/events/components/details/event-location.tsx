import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { MapPinIcon } from "lucide-react";
import type { EventDetail } from "../mock-data";

interface EventLocationProps {
  venue: EventDetail["venue"];
  address: EventDetail["address"];
}

export function EventLocation({ venue, address }: EventLocationProps) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Location</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="size-3.5 shrink-0 text-brand" />
              <span className="text-sm font-medium">{venue}</span>
            </div>
            <p className="text-xs text-muted-foreground pl-5">{address}</p>
          </div>
          {/* Map placeholder */}
          <div className="rounded-lg border bg-muted/50 h-32 flex items-center justify-center text-xs text-muted-foreground">
            Map coming soon
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}
