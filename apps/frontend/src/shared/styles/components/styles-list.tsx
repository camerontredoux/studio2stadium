import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";
import { useSuspenseQuery } from "@tanstack/react-query";
import { styleQueries } from "../api/queries";

interface StylesListProps {
  selectedStyleIds: string[];
  onToggle: (styleId: string) => void;
}

export function StylesList({ selectedStyleIds, onToggle }: StylesListProps) {
  const { data } = useSuspenseQuery(styleQueries.all());

  const max = selectedStyleIds.length >= 3;

  return (
    <div className="flex flex-wrap gap-2">
      {data.map((style) => {
        const isSelected = selectedStyleIds.includes(style.slug);
        return (
          <Button
            key={style.slug}
            disabled={max && !isSelected}
            onClick={() => onToggle(style.slug)}
            variant="outline"
            className={cn(
              "rounded-full before:rounded-full",
              isSelected ? "border-brand bg-brand! text-white" : "",
            )}
          >
            {style.name}
          </Button>
        );
      })}
    </div>
  );
}
