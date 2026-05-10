import { Heart } from "lucide-react";
import { Rating, RatingItem } from "@/components/ui/rating";
import type { DancerRow } from "./columns";

interface DancerCardProps {
  dancer: DancerRow & {
    isFavorited?: boolean;
    interestedInMySchool?: boolean;
    rating?: number | null;
    note?: string | null;
    hasNotes?: boolean;
  };
  onClick: () => void;
}

export function DancerCard({ dancer, onClick }: DancerCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-card hover:bg-accent/50 flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">
          #{dancer.bibNumber != null ? String(dancer.bibNumber).padStart(2, "0") : "—"}
        </span>
        <div className="flex items-center gap-1.5">
          {dancer.isFavorited && (
            <Heart className="size-3.5 fill-current text-red-500" />
          )}
          {dancer.interestedInMySchool && (
            <span className="text-sm text-amber-500">{"★"}</span>
          )}
        </div>
      </div>
      <span className="truncate font-medium">
        {dancer.firstName} {dancer.lastName}
      </span>
      <span className="text-muted-foreground text-sm">
        {dancer.gradYear ?? "—"} {"·"} {dancer.studio ?? "—"} {"·"}{" "}
        {dancer.gpa != null ? dancer.gpa.toFixed(1) : "—"}
      </span>
      {dancer.note && (
        <span className="text-muted-foreground line-clamp-1 text-xs">
          {"✎"} {dancer.note}
        </span>
      )}
      {dancer.rating != null && (
        <Rating disabled size="sm" value={dancer.rating}>
          {Array.from({ length: 5 }, (_, i) => (
            <RatingItem key={i} index={i} />
          ))}
        </Rating>
      )}
    </button>
  );
}
