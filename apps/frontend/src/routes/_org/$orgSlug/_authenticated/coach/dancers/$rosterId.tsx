import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { FavoriteButton } from "@/features/org/components/favorite-button";
import { NotesEditor } from "@/features/org/components/notes-editor";
import { RatingInput } from "@/features/org/components/rating-input";
import { useOrg } from "@/features/org/context/use-org";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/dancers/$rosterId",
)({
  component: DancerProfile,
});

function DancerProfile() {
  const { orgSlug, rosterId } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/dancers/$rosterId",
  });
  const { settings } = useOrg();
  const { data: dancer } = useSuspenseQuery(
    scoutingQueries.dancer(orgSlug, rosterId),
  );
  const ratingMax = (settings.rating_scale_max as number | undefined) ?? 10;

  return (
    <div className="flex flex-col gap-6">
      {/* Header: photo, name, bib, studio/state, favorite button */}
      <div className="flex items-start gap-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-full bg-muted">
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
              <span className="text-muted-foreground font-mono text-sm">
                #{dancer.bibNumber}
              </span>
            )}
            <h1 className="truncate text-xl font-semibold">
              {dancer.firstName} {dancer.lastName}
            </h1>
          </div>
          <div className="text-muted-foreground text-sm">
            {[dancer.studio, dancer.state, dancer.gradYear]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <FavoriteButton
          dancerRosterId={rosterId}
          isFavorited={dancer.isFavorited}
        />
      </div>

      {/* Rating */}
      <section className="flex flex-col gap-2">
        <label className="text-sm font-medium">Rating</label>
        <RatingInput
          value={dancer.rating ?? null}
          max={ratingMax}
          dancerRosterId={rosterId}
        />
      </section>

      {/* Notes */}
      <section className="flex flex-col gap-2">
        <label className="text-sm font-medium">Notes</label>
        <NotesEditor dancerRosterId={rosterId} initial={dancer.note ?? null} />
      </section>

      {/* Bio / extra — show if present */}
      {dancer.bio && (
        <section className="flex flex-col gap-2">
          <label className="text-muted-foreground text-sm font-medium">
            Bio
          </label>
          <p className="whitespace-pre-wrap text-sm">{dancer.bio}</p>
        </section>
      )}
    </div>
  );
}
