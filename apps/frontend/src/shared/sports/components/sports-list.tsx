import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { sportQueries } from "../api/queries";

interface SportsListProps {
  selectedSportIds: string[];
  onToggle: (sportId: string) => void;
}

export function SportsList({ selectedSportIds, onToggle }: SportsListProps) {
  const { data } = useQuery(sportQueries.all());

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row md:gap-6">
      <div className="flex flex-1 flex-col gap-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {data?.map((sport) => {
            const isSelected = selectedSportIds.includes(sport.slug);
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
      </div>
    </div>
  );
}
