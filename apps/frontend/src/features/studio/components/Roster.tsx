import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  photoUrl?: string;
}

const DANCERS: Dancer[] = [
  {
    id: "1",
    name: "Bella Smith",
    team: "Advanced Jazz Team",
    gradYear: 2026,
    gpa: 3.8,
    age: 18,
    photoUrl: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "2",
    name: "Maya Johnson",
    team: "Senior Pom Team",
    gradYear: 2025,
    gpa: 3.6,
    age: 19,
    photoUrl: "https://i.pravatar.cc/150?img=32",
  },
  {
    id: "3",
    name: "Sofia Martinez",
    team: "Competition Hip Hop",
    gradYear: 2027,
    gpa: 3.9,
    age: 17,
    photoUrl: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: "4",
    name: "Avery Thompson",
    team: "Contemporary Company",
    gradYear: 2026,
    gpa: 3.4,
    age: 18,
    photoUrl: "https://i.pravatar.cc/150?img=44",
  },
  {
    id: "5",
    name: "Chloe Nguyen",
    team: "Elite Technique Team",
    gradYear: 2028,
    gpa: 4.0,
    age: 16,
    photoUrl: "https://i.pravatar.cc/150?img=23",
  },
  {
    id: "6",
    name: "Jordan Lee",
    team: "Advanced Jazz Team",
    gradYear: 2027,
    gpa: 3.5,
    age: 17,
    photoUrl: "https://i.pravatar.cc/150?img=48",
  },
  {
    id: "7",
    name: "Natalie Brooks",
    team: "Senior Pom Team",
    gradYear: 2026,
    gpa: 3.7,
    age: 18,
    photoUrl: "https://i.pravatar.cc/150?img=31",
  },
  {
    id: "8",
    name: "Harper Davis",
    team: "Lyrical Performance Team",
    gradYear: 2025,
    gpa: 3.3,
    age: 19,
    photoUrl: "https://i.pravatar.cc/150?img=41",
  },
  {
    id: "9",
    name: "Riley Carter",
    team: "Competition Hip Hop",
    gradYear: 2028,
    gpa: 3.2,
    age: 16,
    photoUrl: "https://i.pravatar.cc/150?img=20",
  },
  {
    id: "10",
    name: "Emma Patel",
    team: "Contemporary Company",
    gradYear: 2027,
    gpa: 3.9,
    age: 17,
    photoUrl: "https://i.pravatar.cc/150?img=16",
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
          <AvatarImage src={dancer.photoUrl ?? undefined} alt={dancer.name} />
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
