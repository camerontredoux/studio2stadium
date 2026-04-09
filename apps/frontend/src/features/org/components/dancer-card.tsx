import { Link } from "@tanstack/react-router";
import { FavoriteButton } from "@/features/org/components/favorite-button";

interface Dancer {
  rosterId: string;
  bibNumber?: number | null;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string | null;
  studio?: string | null;
  state?: string | null;
}

interface DancerCardProps {
  dancer: Dancer;
  slug: string;
  isFavorited: boolean;
}

export function DancerCard({ dancer, slug, isFavorited }: DancerCardProps) {
  return (
    <Link
      to="/$orgSlug/coach/dancers/$rosterId"
      params={{ orgSlug: slug, rosterId: dancer.rosterId }}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
    >
      <div className="size-12 shrink-0 overflow-hidden rounded-full bg-muted">
        {dancer.profilePhotoUrl ? (
          <img
            src={dancer.profilePhotoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {dancer.bibNumber != null && (
            <span className="text-sm font-mono text-muted-foreground">
              #{dancer.bibNumber}
            </span>
          )}
          <span className="truncate font-medium">
            {dancer.firstName} {dancer.lastName}
          </span>
        </div>
        <div className="text-muted-foreground truncate text-xs">
          {[dancer.studio, dancer.state].filter(Boolean).join(" · ")}
        </div>
      </div>
      <FavoriteButton
        dancerRosterId={dancer.rosterId}
        isFavorited={isFavorited}
      />
    </Link>
  );
}
