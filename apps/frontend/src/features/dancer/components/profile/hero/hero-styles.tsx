import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroStyles({
  visible,
  styles,
}: {
  visible: boolean;
  styles: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {styles.map((style) => (
        <Badge key={style} variant="brand">
          {style}
        </Badge>
      ))}
      {visible && (
        <Button
          size="xs"
          variant="outline"
          className="h-5 rounded-sm text-xs sm:h-5"
        >
          Edit
        </Button>
      )}
    </div>
  );
}
