import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import type { EventDetail } from "../mock-data";

interface EventScheduleProps {
  schedule: EventDetail["schedule"];
}

export function EventSchedule({ schedule }: EventScheduleProps) {
  return (
    <Frame>
      <FramePanel>
        <FrameHeader>
          <FrameTitle>Schedule</FrameTitle>
        </FrameHeader>
        <div className="px-5 pb-4">
          <div className="relative flex flex-col gap-0">
            {/* Timeline line */}
            <div className="bg-border absolute top-2 bottom-2 left-[5px] w-px" />

            {schedule.map((item, i) => (
              <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                {/* Timeline dot */}
                <div className="border-brand bg-background relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full border-2" />

                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-brand text-xs font-medium">
                      {item.time}
                    </span>
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  {item.description && (
                    <p className="text-muted-foreground text-xs">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}
