import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarIcon, InfoIcon, PlusIcon, SendIcon } from "lucide-react";
import { recruitingQueries } from "../../api/queries";
import { SendSpotlightDialog } from "./send-spotlight-dialog";

type Spotlight = {
  id: string;
  schoolId: string;
  name: string;
  username: string;
  avatar: string | null;
  sentAt: string;
  featuredUntil: string;
  nextEligibleAt: string;
  active: boolean;
};

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

function SpotlightCard({ spotlight }: { spotlight: Spotlight }) {
  return (
    <div className="bg-card border-brand/30 from-brand/5 flex gap-3 rounded-2xl border bg-linear-to-br to-transparent p-4">
      <div className="bg-muted ring-brand/30 size-12 shrink-0 overflow-clip rounded-xl ring-1">
        {spotlight.avatar ? (
          <img
            src={spotlight.avatar}
            alt={spotlight.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-brand flex h-full w-full items-center justify-center text-base font-semibold">
            {spotlight.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold">{spotlight.name}</h3>
          <Badge
            variant={spotlight.active ? "success" : "outline"}
            className="shrink-0 rounded-full"
          >
            {spotlight.active ? "Active" : "Expired"}
          </Badge>
        </div>
        <div className="text-muted-foreground flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-2">
            <CalendarIcon className="text-brand size-3.5 shrink-0" />
            Sent {formatShort(spotlight.sentAt)}
          </span>
          <span className="flex items-center gap-2">
            <CalendarIcon className="text-brand size-3.5 shrink-0" />
            {spotlight.active ? "Active" : "Expired"} placement:{" "}
            {formatShort(spotlight.sentAt)} –{" "}
            {formatShort(spotlight.featuredUntil)}
          </span>
          <span className="flex items-center gap-2">
            <SendIcon className="text-brand size-3.5 shrink-0" />
            Can spotlight again {formatShort(spotlight.nextEligibleAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MySpotlightsPage() {
  const { data } = useSuspenseQuery(recruitingQueries.mySpotlights());

  const active = data.filter((s) => s.active);
  const history = data.filter((s) => !s.active);

  return (
    <div className="mobile:pb-14 bg-card flex w-full flex-col gap-6 rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl leading-none font-bold tracking-tight">
            My Spotlights
          </h1>
          <p className="text-muted-foreground text-sm">
            Your Profile. Front and Center.
          </p>
        </div>
        <SendSpotlightDialog
          trigger={
            <Button
              size="sm"
              className="bg-brand border-brand-border shadow-brand/24 hover:bg-brand-hover shrink-0 rounded-full text-white"
            >
              <PlusIcon className="size-4" />
              Send Spotlight
            </Button>
          }
        />
      </div>

      <Tabs defaultValue="active" className="flex flex-col gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {active.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <h2 className="text-lg font-semibold">
                Your spotlight starts here
              </h2>
              <p className="text-muted-foreground text-sm">
                Put your profile front and center with a new 7-day spotlight.
              </p>
              <SendSpotlightDialog
                trigger={
                  <Button className="bg-brand border-brand-border shadow-brand/24 hover:bg-brand-hover rounded-full text-white">
                    Send Your First Spotlight
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((s) => (
                <SpotlightCard key={s.id} spotlight={s} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {history.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No past spotlights yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((s) => (
                <SpotlightCard key={s.id} spotlight={s} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="text-muted-foreground flex items-center gap-3 border-t pt-4 text-sm">
        <InfoIcon className="size-4 shrink-0" />
        <p>
          Spotlights last 7 days and notify the selected program's coaches.
          Views and responses aren't guaranteed.
        </p>
      </div>
    </div>
  );
}
