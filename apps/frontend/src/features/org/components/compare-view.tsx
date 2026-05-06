import { useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { FavoriteButton } from "./favorite-button";
import { RatingInput } from "./rating-input";
import { cn } from "@/components/utils/cn";

interface CompareViewProps {
  compareIds: string[];
  onRemove: (rosterId: string) => void;
  onBack: () => void;
  onOpenSheet: (rosterId: string) => void;
}

export function CompareView({
  compareIds,
  onRemove,
  onBack,
  onOpenSheet,
}: CompareViewProps) {
  const { org } = useOrg();

  const dancerQueries = useQueries({
    queries: compareIds.map((id) => scoutingQueries.dancer(org.slug, id)),
  });

  const dancerData = dancerQueries.map((q) => q.data);
  const maxGpa = useMemo(() => {
    const gpas = dancerData
      .map((d) => d?.gpa)
      .filter((g): g is number => g != null);
    return gpas.length > 0 ? Math.max(...gpas) : 0;
  }, [dancerData]);

  const maxRating = useMemo(() => {
    const ratings = dancerData
      .map((d) => d?.rating)
      .filter((r): r is number => r != null);
    return ratings.length > 0 ? Math.max(...ratings) : 0;
  }, [dancerData]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeftIcon className="size-3.5" />
          Back to table
        </Button>
      </div>

      <div
        className={cn(
          "grid gap-4",
          compareIds.length === 2 ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {compareIds.map((rosterId, idx) => (
          <CompareColumn
            key={rosterId}
            rosterId={rosterId}
            query={dancerQueries[idx] as UseQueryResult<any>}
            maxGpa={maxGpa}
            maxRating={maxRating}
            onRemove={onRemove}
            onOpenSheet={onOpenSheet}
          />
        ))}
      </div>
    </div>
  );
}

function CompareColumn({
  rosterId,
  query,
  maxGpa,
  maxRating,
  onRemove,
  onOpenSheet,
}: {
  rosterId: string;
  query: UseQueryResult<any>;
  maxGpa: number;
  maxRating: number;
  onRemove: (rosterId: string) => void;
  onOpenSheet: (rosterId: string) => void;
}) {
  const dancer = query.data;

  if (query.isLoading || !dancer) {
    return (
      <div className="bg-card border-border flex flex-col gap-4 rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-3 w-48 rounded" />
        <Skeleton className="h-10 w-16 rounded" />
        <Skeleton className="h-5 w-28 rounded" />
        <Skeleton className="h-20 w-full rounded" />
      </div>
    );
  }

  const isTopGpa = dancer.gpa != null && dancer.gpa >= maxGpa;
  const isTopRating = dancer.rating != null && dancer.rating >= maxRating;

  return (
    <div className="bg-card border-border flex flex-col gap-4 rounded-lg border p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar className="size-12 rounded-lg">
            <AvatarImage src={dancer.profilePhotoUrl ?? undefined} />
            <AvatarFallback className="rounded-lg">
              {dancer.firstName?.[0]}
              {dancer.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => onOpenSheet(rosterId)}
              className="text-left text-base font-semibold hover:underline"
            >
              {dancer.bibNumber != null && (
                <span className="text-muted-foreground mr-1 font-mono text-xs">
                  #{String(dancer.bibNumber).padStart(2, "0")}
                </span>
              )}
              {dancer.firstName} {dancer.lastName}
            </button>
            <p className="text-muted-foreground text-sm">
              {[
                dancer.gradYear ? `Class of ${dancer.gradYear}` : null,
                dancer.state,
                dancer.studio,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(rosterId)}
          className="text-muted-foreground hover:text-foreground p-0.5"
          aria-label="Remove from compare"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* GPA */}
      <div>
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          GPA
        </span>
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums",
            isTopGpa ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {dancer.gpa != null ? dancer.gpa.toFixed(1) : "—"}
        </p>
      </div>

      {/* Rating */}
      <div>
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Rating
        </span>
        <div className={cn("mt-1", !isTopRating && dancer.rating != null && "opacity-60")}>
          <RatingInput value={dancer.rating ?? null} dancerRosterId={rosterId} />
        </div>
      </div>

      {/* Favorite */}
      <FavoriteButton dancerRosterId={rosterId} isFavorited={dancer.isFavorited} />

      {/* Notes */}
      <div>
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Notes
        </span>
        {dancer.note ? (
          <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
            {dancer.note}
          </p>
        ) : (
          <p className="text-muted-foreground mt-1 text-sm italic">
            No notes yet
          </p>
        )}
      </div>

      {/* Bio */}
      {dancer.bio && (
        <div>
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Bio
          </span>
          <p className="text-muted-foreground mt-1 line-clamp-4 text-sm whitespace-pre-wrap">
            {dancer.bio}
          </p>
        </div>
      )}
    </div>
  );
}
