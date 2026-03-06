import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";
import { useSuspenseQuery } from "@tanstack/react-query";
import { sportQueries } from "../api/queries";

interface SportsListProps {
  selectedSportIds: string[];
  onToggle: (sportId: string) => void;
}

export function SportsList({ selectedSportIds, onToggle }: SportsListProps) {
  const { data } = useSuspenseQuery(sportQueries.all());

  const selectedSet = new Set(selectedSportIds);

  return (
    <div className="flex flex-wrap gap-2">
      {data.map((sport) => {
        const isSelected = selectedSet.has(sport.slug);
        return (
          <Button
            key={sport.slug}
            onClick={() => onToggle(sport.slug)}
            variant="outline"
            className={cn(
              "rounded-full before:rounded-full",
              isSelected ? "border-brand bg-brand! text-white" : "",
            )}
          >
            {sport.name}
          </Button>
        );
      })}
    </div>
  );
}
