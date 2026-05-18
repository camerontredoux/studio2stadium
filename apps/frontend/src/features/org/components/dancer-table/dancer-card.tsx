import { Heart, Megaphone, PencilIcon, PlusIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Rating, RatingItem } from "@/components/ui/rating";
import type { SearchDancerRow } from "./columns";

interface DancerCardProps {
  dancer: SearchDancerRow;
  onFavoriteToggle: (rosterId: string, current: boolean) => void;
  onRate: (rosterId: string, rating: number) => void;
  onOpenNotes: (rosterId: string) => void;
  onCallbackToggle?: (rosterId: string, current: boolean) => void;
}

export function DancerCard({
  dancer,
  onFavoriteToggle,
  onRate,
  onOpenNotes,
  onCallbackToggle,
}: DancerCardProps) {
  const NoteIcon = dancer.hasNote ? PencilIcon : PlusIcon;

  return (
    <div className="bg-card flex w-full flex-col gap-1.5 rounded-lg border p-3">
      {/* Header: bib + school interest */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">
          #{dancer.bibNumber != null ? String(dancer.bibNumber).padStart(2, "0") : "—"}
        </span>
        {dancer.interestedInMySchool && (
          <span className="text-sm text-amber-500">{"★"}</span>
        )}
      </div>

      {/* Name */}
      <span className="truncate font-medium">
        {dancer.firstName} {dancer.lastName}
      </span>

      {/* Meta */}
      <span className="text-muted-foreground text-sm">
        {dancer.gradYear ?? "—"} {"·"} {dancer.studio ?? "—"} {"·"}{" "}
        {dancer.gpa != null ? dancer.gpa.toFixed(1) : "—"}
      </span>

      {/* Action bar */}
      <div className="mt-1 flex items-center gap-3">
        {/* Favorite toggle */}
        <button
          type="button"
          onClick={() => onFavoriteToggle(dancer.rosterId, dancer.isFavorited)}
          className="flex cursor-pointer items-center justify-center"
          aria-label={dancer.isFavorited ? "Unfavorite" : "Favorite"}
        >
          <Heart
            className={`size-4 ${
              dancer.isFavorited
                ? "fill-current text-red-500"
                : "text-muted-foreground"
            }`}
          />
        </button>

        {/* Interactive rating */}
        <Rating
          size="sm"
          value={dancer.rating ?? 0}
          onValueChange={(v) => onRate(dancer.rosterId, v)}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <RatingItem key={i} index={i} />
          ))}
        </Rating>

        {/* Callback pill */}
        {onCallbackToggle && (
          <button
            type="button"
            onClick={() => onCallbackToggle(dancer.rosterId, dancer.isCalledBack)}
            className={`flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
              dancer.isCalledBack
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label={dancer.isCalledBack ? "Remove callback" : "Call back"}
            aria-pressed={dancer.isCalledBack}
          >
            <Megaphone className="size-3" />
            {dancer.isCalledBack ? "Called" : "Call"}
          </button>
        )}

        {/* Notes button */}
        <button
          type="button"
          onClick={() => onOpenNotes(dancer.rosterId)}
          className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center justify-center transition-colors"
          aria-label={dancer.hasNote ? "Edit notes" : "Add notes"}
        >
          <NoteIcon className="size-4" />
        </button>
      </div>

      {/* Profile link */}
      {dancer.username && (
        <Link
          to="/$username"
          params={{ username: dancer.username }}
          className="border-border text-foreground mt-1 flex w-full items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Visit Profile →
        </Link>
      )}
    </div>
  );
}
