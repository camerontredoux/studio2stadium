import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { US_STATES } from "@/utils/constants/states";
import { STYLES } from "@/utils/constants/styles";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MapPin, SparklesIcon, StarIcon, Users2Icon } from "lucide-react";
import { feedQueries } from "../api/queries";
import type { RecommendedSchool } from "../types";

type MatchTier = RecommendedSchool["matchTier"];

function MatchTierBadge({ matchTier }: { matchTier: MatchTier }) {
  return (
    <Badge
      variant={
        matchTier === "excellent"
          ? "success"
          : matchTier === "good"
            ? "warning"
            : matchTier === "partial"
              ? "info"
              : "outline"
      }
      className="rounded-full"
    >
      {matchTier
        ? matchTier?.slice(0, 1).toUpperCase() + matchTier?.slice(1)
        : "Extra"}{" "}
      Match
    </Badge>
  );
}

export function ProgramSpotlight() {
  const { data } = useSuspenseQuery(feedQueries.recommended());

  if (data.length === 0) {
    return <div>No recommended programs found</div>;
  }

  const recommended = data[0];

  return (
    <div className="overflow-clip rounded-2xl border">
      <div className="from-brand/10 via-brand/5 to-background relative overflow-clip bg-linear-to-br p-4">
        <div className="text-brand absolute -top-1 -left-2 -z-10 flex items-center gap-2 opacity-10">
          <SparklesIcon className="size-24 rotate-6" />
          <SparklesIcon className="size-16 rotate-186" />
        </div>
        <div className="flex justify-between gap-2">
          <h2 className="font-semibold">Program Spotlight</h2>
          <MatchTierBadge matchTier={recommended.matchTier} />
        </div>
        <p className="text-muted-foreground text-sm">
          Based on your profile and preferences
        </p>
      </div>
      <div className="from-brand/10 via-background to-background grid grid-cols-1 gap-2 border-t bg-linear-to-tl p-2 sm:grid-cols-2 sm:gap-4 sm:p-4">
        <div className="relative aspect-video overflow-clip rounded-2xl">
          <img
            src="https://images.unsplash.com/photo-1724436781032-c1645c5783ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYwNTQ4OTIwfDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Program Image"
            className="h-full w-full scale-105 object-cover blur-[2px]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 to-black/20" />
          <div className="absolute bottom-2 left-2 flex items-center gap-2 p-1">
            <div className="size-12 shrink-0 overflow-clip rounded-lg bg-white shadow-lg">
              <img
                src={recommended.avatar ?? undefined}
                alt="Program Image"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-auto text-white">
              <h3 className="text-sm font-semibold">{recommended.name}</h3>
              <p className="flex items-center gap-1 text-xs">
                <MapPin className="text-brand size-3" />{" "}
                {US_STATES[recommended.location as keyof typeof US_STATES]}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:gap-4">
          <p className="line-clamp-4 text-sm">{recommended.about}</p>
          <div className="flex flex-col gap-3">
            <div className="space-y-1">
              <h3 className="text-muted-foreground text-sm">
                Program Strengths
              </h3>
              <div className="flex gap-2">
                {recommended.top3Matches.map((style) => (
                  <Badge
                    key={style}
                    className="rounded-full"
                    size="lg"
                    variant="secondary"
                  >
                    <StarIcon className="text-brand" />{" "}
                    {STYLES[style as keyof typeof STYLES]}
                  </Badge>
                ))}
              </div>
            </div>
            {recommended.size && recommended.size > 0 && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Users2Icon className="size-4" />{" "}
                {recommended.size.toLocaleString() ?? "Unknown"} Dance Students
              </div>
            )}
            <div className="flex flex-1 items-center gap-2">
              <Button
                className="flex-1"
                render={
                  <Link
                    to="/explore/$username"
                    params={{ username: recommended.username }}
                  />
                }
              >
                View Program
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
