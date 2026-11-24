import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { feedQueries } from "@/features/feed/api/queries";
import type { PrioritySpotlightDancer } from "@/features/feed/types";
import { US_STATES } from "@/utils/constants/states";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  GraduationCapIcon,
  MapPinIcon,
  TargetIcon,
} from "lucide-react";

function formatShort(iso: string): string {
  const [date] = iso.split("T");
  const [, month, day] = date.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[month - 1]} ${day}`;
}

function SpotlightDancerCard({ dancer }: { dancer: PrioritySpotlightDancer }) {
  return (
    <Link
      to="/$username"
      params={{ username: dancer.username }}
      className="bg-card border-brand/30 from-brand/5 hover:border-brand/60 flex gap-4 rounded-2xl border bg-linear-to-br to-transparent p-5 transition-colors"
    >
      <div className="bg-muted ring-brand/30 size-16 shrink-0 overflow-clip rounded-xl ring-1">
        {dancer.avatar ? (
          <img
            src={dancer.avatar}
            alt={dancer.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-brand flex h-full w-full items-center justify-center text-base font-semibold">
            {dancer.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold">{dancer.name}</h3>
          <Badge
            variant={dancer.active ? "success" : "outline"}
            className="shrink-0 rounded-full"
          >
            {dancer.active ? "Active" : "Ended"}
          </Badge>
        </div>
        <div className="text-muted-foreground flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-2">
            <MapPinIcon className="text-brand size-3.5 shrink-0" />
            {US_STATES[dancer.location as keyof typeof US_STATES] ??
              dancer.location}
          </span>
          {dancer.gradYear ? (
            <span className="flex items-center gap-2">
              <GraduationCapIcon className="text-brand size-3.5 shrink-0" />
              Class of {dancer.gradYear}
            </span>
          ) : null}
          {dancer.gpa != null && (
            <span className="flex items-center gap-2">
              <TargetIcon className="text-brand size-3.5 shrink-0" />
              {dancer.gpa} GPA
            </span>
          )}
          <span className="flex items-center gap-2">
            <CalendarIcon className="text-brand size-3.5 shrink-0" />
            Sent {formatShort(dancer.sentAt)} · Featured through{" "}
            {formatShort(dancer.featuredUntil)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SpotlightGrid({
  dancers,
  emptyLabel,
}: {
  dancers: PrioritySpotlightDancer[];
  emptyLabel: string;
}) {
  if (dancers.length === 0) {
    return (
      <div className="text-muted-foreground flex min-h-40 items-center justify-center rounded-2xl border border-dashed text-sm">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3">
      {dancers.map((dancer) => (
        <SpotlightDancerCard key={dancer.id} dancer={dancer} />
      ))}
    </div>
  );
}

export function PrioritySpotlightsPage() {
  const { data } = useSuspenseQuery(feedQueries.prioritySpotlights());

  const active = data.filter((d) => d.active);
  const history = data.filter((d) => !d.active);

  return (
    <div className="mobile:pb-14 flex w-full flex-col gap-5">
      <div className="flex flex-col gap-0.5 max-sm:pl-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl leading-none font-bold tracking-tight">
            Dancer Spotlights
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          These dancers have chosen to spotlight their profiles with your program. Explore their recruit profile.
        </p>
      </div>

      <Tabs defaultValue="active" className="flex flex-col gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Active
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <SpotlightGrid
            dancers={active}
            emptyLabel="No active dancer spotlights right now. Check back soon."
          />
        </TabsContent>

        <TabsContent value="history">
          <SpotlightGrid
            dancers={history}
            emptyLabel="No past dancer spotlights yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
