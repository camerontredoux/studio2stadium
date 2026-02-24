import { Badge } from "@/components/ui/badge";
import { useProfile } from "../context/use-profile";

export function HeroStyles({ styles }: { styles: string[] }) {
  const { showOwnerControls } = useProfile();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {styles.length > 0 ? (
        styles.map((style) => (
          <Badge key={style} variant="brand">
            {style}
          </Badge>
        ))
      ) : (
        <Badge variant="brand">No styles</Badge>
      )}
      {showOwnerControls && (
        <Badge
          role="button"
          aria-label="Edit styles"
          tabIndex={0}
          className="cursor-pointer"
          onClick={() => alert("Edit")}
        >
          Edit
        </Badge>
      )}
    </div>
  );
}
