import { HeartIcon, Loader2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Rating, RatingItem } from "@/components/ui/rating";
import { cn } from "@/components/utils/cn";

interface FloatingActionBarProps {
  selectedCount: number;
  isVisible: boolean;
  onFavoriteAll: () => void;
  onRateAll: (rating: number) => void;
  onClear: () => void;
  isLoading: boolean;
}

export function FloatingActionBar({
  selectedCount,
  isVisible,
  onFavoriteAll,
  onRateAll,
  onClear,
  isLoading,
}: FloatingActionBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center",
        "transition-all duration-200 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <div className="bg-background border-border pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-2.5 shadow-lg">
        <span className="text-sm font-medium tabular-nums">
          {isLoading ? `Updating ${selectedCount}...` : `${selectedCount} selected`}
        </span>

        <div className="bg-border h-4 w-px" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onFavoriteAll}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <HeartIcon className="size-3.5" />
          )}
          Favorite
        </Button>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">Rate all</span>
          <Rating
            size="sm"
            value={0}
            onValueChange={(v) => onRateAll(v)}
            disabled={isLoading}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <RatingItem key={i} index={i} />
            ))}
          </Rating>
        </div>

        <div className="bg-border h-4 w-px" />

        <Button variant="ghost" size="sm" onClick={onClear} disabled={isLoading}>
          <XIcon className="size-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}
