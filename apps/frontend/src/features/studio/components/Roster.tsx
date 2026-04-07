import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";

interface Dancer {
  id: string;
  name: string;
  team: string;
  gradYear: number;
  gpa: number;
  age: number;
}

const DANCERS: Dancer[] = [
  {
    id: "1",
    name: "Bella Smith",
    team: "Advanced Jazz Team",
    gradYear: 2026,
    gpa: 3.0,
    age: 18,
  },
  {
    id: "2",
    name: "Bella Smith",
    team: "Advanced Jazz Team",
    gradYear: 2026,
    gpa: 3.0,
    age: 18,
  },
  {
    id: "3",
    name: "Bella Smith",
    team: "Advanced Jazz Team",
    gradYear: 2026,
    gpa: 3.0,
    age: 18,
  },
  {
    id: "4",
    name: "Bella Smith",
    team: "Advanced Jazz Team",
    gradYear: 2026,
    gpa: 3.0,
    age: 18,
  },
  {
    id: "5",
    name: "Bella Smith",
    team: "Advanced Jazz Team",
    gradYear: 2026,
    gpa: 3.0,
    age: 18,
  },
];

export function Roster() {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Dancers</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <div className="flex flex-col gap-3">
          {DANCERS.map((dancer) => (
            <DancerRow key={dancer.id} dancer={dancer} />
          ))}
        </div>
      </FramePanel>
    </Frame>
  );
}

function DancerRow({ dancer }: { dancer: Dancer }) {
  const initials = dancer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback className="bg-gray-500 font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold">{dancer.name}</span>
          <span className="text-muted-foreground text-sm">{dancer.team}</span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs">Grad</span>
          <span className="font-medium">{dancer.gradYear}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs">GPA</span>
          <span className="font-medium">{dancer.gpa.toFixed(1)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs">Age</span>
          <span className="font-medium">{dancer.age}</span>
        </div>
      </div>
    </div>
  );
}
