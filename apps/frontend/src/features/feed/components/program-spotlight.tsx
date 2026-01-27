import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, SparklesIcon, StarIcon, Users2Icon } from "lucide-react";

export function ProgramSpotlight() {
  return (
    <div className="rounded-xl border overflow-clip">
      <div className="relative overflow-clip p-4 bg-linear-to-br from-muted via-brand/5 to-white ">
        <div className="absolute -left-2 opacity-3 flex items-center text-secondary-foreground gap-2 -top-1 -z-10">
          <SparklesIcon className="size-24 rotate-6" />
          <SparklesIcon className="size-16 rotate-186" />
        </div>
        <div className="flex justify-between gap-2">
          <h2 className="font-semibold">Program Spotlight</h2>
          <Badge variant="secondary" className="rounded-full">
            94% Match
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on your profile and preferences
        </p>
      </div>
      <div className="bg-linear-to-tl from-sky-50/30 via-white to-white border-t p-2 sm:p-4 grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2">
        <div className="relative aspect-video rounded-xl overflow-clip">
          <img
            src="https://images.unsplash.com/photo-1724436781032-c1645c5783ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYwNTQ4OTIwfDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Program Image"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-2 flex items-center gap-2 p-1">
            <div className="rounded-lg overflow-clip h-12 w-12 shadow-lg shrink-0">
              <img
                src="https://images.unsplash.com/photo-1724436781032-c1645c5783ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYwNTQ4OTIwfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Program Image"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-white mt-auto">
              <h3 className="text-sm font-semibold">
                University of Southern California
              </h3>
              <p className="text-xs flex items-center gap-1">
                <MapPin className="size-3" /> Los Angeles, CA
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            USC Kaufman offers a world-class dance program with renowned
            faculty, state-of-the-art facilities, and connections to the
            entertainment industry.
          </p>
          <div className="gap-3 flex flex-col">
            <div className="space-y-1">
              <h3 className="text-muted-foreground text-sm">
                Program Strengths
              </h3>
              <div className="flex gap-2">
                <Badge className="rounded-full" size="lg" variant="secondary">
                  <StarIcon /> Dance
                </Badge>
                <Badge className="rounded-full" size="lg" variant="secondary">
                  <StarIcon /> Jazz
                </Badge>
              </div>
            </div>
            <div className="flex items-center text-muted-foreground text-sm gap-2">
              <Users2Icon className="size-4" /> 350 Dance Students
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Button className="flex-1">View Program</Button>
              <Button className="flex-1" variant="outline">
                Follow
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
