import { Badge } from "@/components/ui/badge";
import { useProfile } from "../context/use-profile";
import { StylesList } from "../styles-list";

export function HeroStyles({ styles }: { styles: string[] }) {
  const { showOwnerControls } = useProfile();

  return (
    <div className="col-span-2 flex flex-wrap items-center gap-2 px-1">
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
        <StylesList
          render={
            <Badge
              role="button"
              aria-label="Edit styles"
              tabIndex={0}
              className="cursor-pointer"
            >
              Edit
            </Badge>
          }
        />
      )}
    </div>
  );
}
