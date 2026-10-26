import { TrophyIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/event/button";
import { Label } from "@/components/event/label";
import { RatingMeter } from "@/components/event/rating";
import { Widget } from "@/components/event/shell";
import { cn } from "@/components/utils/cn";
import { useOrg } from "@/features/org/context/use-org";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";

import {
  dancerName,
  type ScoutedDancer,
  type useCoachScouting,
} from "./coach-scouting";
import { CallToggle, FavoriteToggle } from "./scouting-controls";

type Scouting = ReturnType<typeof useCoachScouting>;

const rank = (index: number) => String(index + 1).padStart(2, "0");

export function OpenRosterButton() {
  const { org } = useOrg();
  return (
    <Button
      size="sm"
      render={
        <Link to="/o/$orgSlug/coach/dancers" params={{ orgSlug: org.slug }} />
      }
    >
      Open roster
    </Button>
  );
}

/**
 * The coach's top-ranked dancers. Peek: number one large, then two and three;
 * open: every rated dancer with favourite and callback toggles, and how many
 * are still unrated.
 */
export function TopRankedWidget({
  ranked,
  rosterSize,
  ratedCount,
  hasMore,
  loadingMore,
  onLoadMore,
  scouting,
}: {
  /** Rated dancers, best first, as many pages as have loaded. */
  ranked: ScoutedDancer[];
  rosterSize: number;
  ratedCount: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  scouting: Scouting;
}) {
  const unrated = rosterSize - ratedCount;
  const [top, ...rest] = ranked;
  const showCall = scouting.callbacksEnabled;

  return (
    <Widget
      id="top"
      label="Top ranked"
      icon={TrophyIcon}
      count={ratedCount}
      peek={
        top ? (
          <>
            <span className="flex min-w-0 flex-col gap-(--space-6)">
              <span className="text-fg-3 font-mono text-[11px]">01</span>
              <span className="truncate text-[18px] leading-[1.2] font-semibold tracking-[-0.01em]">
                {dancerName(top)}
              </span>
              <span className="flex min-w-0 items-center gap-(--space-10)">
                <RatingMeter
                  value={top.rating ?? 0}
                  max={scouting.ratingMax}
                  size="lg"
                />
                <span className="text-fg-3 truncate font-mono text-[11.5px]">
                  {[top.bibNumber, top.studio].filter(Boolean).join(" · ")}
                </span>
              </span>
            </span>
            {rest.length > 0 && (
              <span className="border-line-soft bp-phone:hidden flex flex-col gap-(--space-6) border-t pt-(--space-10)">
                {rest.slice(0, 2).map((dancer, index) => (
                  <span
                    key={dancer.rosterId}
                    className="flex min-w-0 items-center gap-(--space-10)"
                  >
                    <span className="text-fg-3 flex-none font-mono text-[11px]">
                      {rank(index + 1)}
                    </span>
                    <span className="text-fg-2 min-w-0 flex-1 truncate">
                      {dancerName(dancer)}
                    </span>
                    <RatingMeter
                      value={dancer.rating ?? 0}
                      max={scouting.ratingMax}
                    />
                  </span>
                ))}
              </span>
            )}
          </>
        ) : (
          <span className="text-fg-3 text-[12.5px]">No ratings yet</span>
        )
      }
    >
      {ranked.map((dancer, index) => {
        const name = dancerName(dancer);
        const editable = scouting.canScoutDancer(dancer);
        return (
          <div
            key={dancer.rosterId}
            className={cn(
              "border-line-soft grid min-h-12 items-center gap-x-(--space-12) border-b ps-(--space-14) pe-(--space-8)",
              showCall
                ? "grid-cols-[32px_40px_minmax(0,1.2fr)_minmax(0,1fr)_86px_28px_96px]"
                : "grid-cols-[32px_40px_minmax(0,1.2fr)_minmax(0,1fr)_86px_28px]",
              "bp-phone:gap-x-(--space-8) bp-phone:ps-(--space-12)",
              showCall
                ? "bp-phone:grid-cols-[28px_36px_minmax(0,1fr)_72px_28px_32px]"
                : "bp-phone:grid-cols-[28px_36px_minmax(0,1fr)_72px_28px]",
            )}
          >
            <span className="text-fg font-mono text-[15px] font-medium">
              {rank(index)}
            </span>
            <span>
              <DancerBib dancer={dancer} className="text-fg-2 text-[12.5px]" />
            </span>
            <span className="min-w-0 truncate font-medium">{name}</span>
            <span className="text-fg-2 bp-phone:hidden min-w-0 truncate">
              {dancer.studio ?? "–"}
            </span>
            <RatingMeter
              value={dancer.rating ?? 0}
              max={scouting.ratingMax}
              size="row"
            />
            <FavoriteToggle
              name={name}
              pressed={dancer.isFavorited}
              disabled={!editable}
              onChange={() => void scouting.toggleFavorite(dancer)}
            />
            {showCall && (
              <CallToggle
                name={name}
                pressed={dancer.isCalledBack}
                disabled={!editable}
                onChange={() => void scouting.toggleCallback(dancer)}
              />
            )}
          </div>
        );
      })}
      {hasMore && (
        <div className="border-line-soft flex min-h-11 items-center justify-center border-b px-(--space-14)">
          <Button size="sm" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore
              ? "Loading…"
              : `Show more (${ratedCount - ranked.length} left)`}
          </Button>
        </div>
      )}
      {ranked.length === 0 ? (
        <div className="text-fg-3 flex min-h-[120px] flex-col items-center justify-center gap-(--space-10) p-(--space-16) text-center">
          <span>No ratings yet</span>
          <OpenRosterButton />
        </div>
      ) : (
        unrated > 0 && (
          <div className="text-fg-3 flex min-h-11 items-center gap-(--space-10) px-(--space-14)">
            <Label>Unrated</Label>
            <span className="text-fg-2 font-mono text-[12px]">{unrated}</span>
            <span className="flex-1" />
            <OpenRosterButton />
          </div>
        )
      )}
    </Widget>
  );
}
