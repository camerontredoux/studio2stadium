import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { GraduationCapIcon } from "lucide-react";
import { FilterSidebar } from "./filter-sidebar";
import { FilterSheet } from "./filters/filter-sheet";
import { type School, SchoolCard } from "./school-card";

const MOCK_SCHOOLS: School[] = [
  {
    username: "usc-kaufman",
    name: "USC Kaufman School of Dance",
    avatar:
      "https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=100&h=100&fit=crop",
    initials: "UK",
    location: "Los Angeles, CA",
    verified: true,
    styles: ["Contemporary", "Ballet", "Hip Hop"],
  },
  {
    username: "juilliard",
    name: "The Juilliard School",
    avatar:
      "https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop",
    initials: "TJ",
    location: "New York, NY",
    verified: true,
    styles: ["Ballet", "Modern", "Contemporary"],
  },
  {
    username: "nyu-tisch",
    name: "NYU Tisch School of the Arts",
    avatar:
      "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=100&h=100&fit=crop",
    initials: "NT",
    location: "New York, NY",
    verified: true,
    styles: ["Modern", "Jazz", "Experimental"],
  },
  {
    username: "unc-sa",
    name: "UNC School of the Arts",
    avatar:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&h=100&fit=crop",
    initials: "US",
    location: "Winston-Salem, NC",
    verified: true,
    styles: ["Ballet", "Contemporary", "Modern"],
  },
  {
    username: "point-park",
    name: "Point Park University",
    avatar:
      "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=100&h=100&fit=crop",
    initials: "PP",
    location: "Pittsburgh, PA",
    verified: false,
    styles: ["Jazz", "Ballet", "Musical Theater"],
  },
  {
    username: "ucla-dance",
    name: "UCLA World Arts and Cultures/Dance",
    avatar:
      "https://images.unsplash.com/photo-1568792923760-d70635a89fdc?w=100&h=100&fit=crop",
    initials: "UD",
    location: "Los Angeles, CA",
    verified: true,
    styles: ["World Dance", "Choreography", "Contemporary"],
  },
  {
    username: "fordham-ailey",
    name: "Fordham / Ailey BFA Program",
    avatar:
      "https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=100&h=100&fit=crop",
    initials: "FA",
    location: "New York, NY",
    verified: true,
    styles: ["Modern", "Ballet", "Jazz"],
  },
  {
    username: "butler-jordan",
    name: "Butler University Jordan College",
    avatar:
      "https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=100&h=100&fit=crop",
    initials: "BJ",
    location: "Indianapolis, IN",
    verified: false,
    styles: ["Ballet", "Jazz", "Modern"],
  },
];

export function Page() {
  return (
    <SidebarLayout sidebar={<FilterSidebar />}>
      <div className="flex flex-col gap-2 lg:gap-4 max-lg:pb-14">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5 max-sm:pl-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Explore Schools
              </h1>
              <Badge variant="brand" className="gap-1">
                <GraduationCapIcon className="size-3" />
                {MOCK_SCHOOLS.length} programs
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Discover top dance programs and find your perfect fit
            </p>
          </div>
          <div className="lg:hidden">
            <FilterSheet />
          </div>
        </div>

        <div className="space-y-2 lg:space-y-3">
          {MOCK_SCHOOLS.map((school) => (
            <SchoolCard key={school.username} school={school} />
          ))}
        </div>
      </div>
    </SidebarLayout>
  );
}
