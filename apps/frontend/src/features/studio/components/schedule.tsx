import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Button } from "@/components/ui/button"

interface Schedule {
  id: string;
  title: string;
  date: string;
  location: string;
}

const SCHEDULES: Schedule[] = [
  {
    id: "1",
    title: "Rocky Mountain Dance Invitational",
    date: "03-15-2026",
    location: "Denver Convention Center"
  },
  {
    id: "2",
    title: "Colorado Dance Showdown",
    date: "04-10-2026",
    location: "Buell Theater, Denver"
  },
  {
    id: "3",
    title: "Mile High Dance Championship",
    date: "04-25-2026",
    location: "Paramount Theatre, Denver"
  },
  {
    id: "4",
    title: "Front Range Dance Festival",
    date: "05-08-2026",
    location: "Arapahoe High School, Littleton"
  },
  {
    id: "5",
    title: "Boulder Dance Invitational",
    date: "05-20-2026",
    location: "Boulder High School Auditorium"
  },
  {
    id: "6",
    title: "Colorado Springs Dance Elite",
    date: "06-05-2026",
    location: "Broadmoor Hotel, Colorado Springs"
  },
  {
    id: "7",
    title: "Centennial State Dance Battle",
    date: "06-15-2026",
    location: "Red Rocks Dance Studio"
  },
  {
    id: "8",
    title: "Senior Showcase & Gala",
    date: "06-27-2026",
    location: "Denver Arts & Culture Center"
  },
];

export function Schedule() {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Schedule</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <div className="flex flex-col gap-3">
          {SCHEDULES.map((schedule) => (
            <ScheduleRow key={schedule.id} schedule={schedule} />
          ))}
        </div>
      </FramePanel>
    </Frame>
  );
}

function ScheduleRow({ schedule }: { schedule: Schedule }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
            <span className="font-semibold text-md">{schedule.title}</span>
            <span className="text-sm">{schedule.location}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-muted-foreground text-sm">{schedule.date}</span>
            <Button>View Event</Button>
        </div>
      </div>
    </div>
  );
}