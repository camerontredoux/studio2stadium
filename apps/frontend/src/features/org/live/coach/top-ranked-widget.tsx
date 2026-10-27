import { MegaphoneSimpleIcon, TrophyIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import { RatingMeter } from "@/components/event/rating";
import { Widget } from "@/components/event/shell";
import { Tag } from "@/components/event/tag";
import { useOrg } from "@/features/org/context/use-org";

import {
  dancerName,
  type ScoutedDancer,
  type useCoachScouting,
} from "./coach-scouting";
import { HeartFillIcon } from "./scouting-controls";

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

/** The small grey mono "Bib 230" over a widget row's name. */
export function BibLabel({ bib }: { bib: number | null | undefined }) {
  return (
    <span className="text-fg-3 flex-none font-mono text-[11.5px] tabular-nums">
      Bib {bib ?? "–"}
    </span>
  );
}

/** The "Called" mark on a called-back dancer's row, as the dancer view shows it. */
function CalledTag() {
  return (
    <Tag>
      <Icon icon={MegaphoneSimpleIcon} />
      Called
    </Tag>
  );
}

/**
 * The coach's top-ranked dancers. Peek: number one large, then two and three;
 * open: every rated dancer, read-only, with their stars, a heart for a
 * favorite and a "Called" tag, then how many are still unrated. "Open roster"
 * in the head leads to the roster, where the coach marks dancers.
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

  return (
    <Widget
      id="top"
      label="Top ranked"
      icon={TrophyIcon}
      count={ratedCount}
      actions={<OpenRosterButton />}
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
      {/* Read-only: the coach rates, favorites and calls back on the roster. */}
      {ranked.map((dancer, index) => (
        <div
          key={dancer.rosterId}
          className="border-line-soft bp-phone:ps-(--space-12) grid min-h-14 grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-(--space-12) border-b py-(--space-8) ps-(--space-14) pe-(--space-14)"
        >
          <span className="text-fg font-mono text-[15px] font-medium">
            {rank(index)}
          </span>
          <span className="flex min-w-0 flex-col gap-(--space-2)">
            <span className="flex min-w-0 items-center gap-(--space-8)">
              <BibLabel bib={dancer.bibNumber} />
              <RatingMeter value={dancer.rating ?? 0} max={scouting.ratingMax} />
              {dancer.isFavorited && (
                <Icon
                  icon={HeartFillIcon}
                  size={11}
                  label="Favorite"
                  className="text-danger"
                />
              )}
            </span>
            <span className="text-fg min-w-0 truncate font-medium">
              {dancerName(dancer)}
            </span>
          </span>
          {dancer.isCalledBack ? <CalledTag /> : <span />}
        </div>
      ))}
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
        <div className="text-fg-3 flex min-h-[120px] items-center justify-center p-(--space-16) text-center">
          No ratings yet
        </div>
      ) : (
        unrated > 0 && (
          <div className="text-fg-3 flex min-h-11 items-center gap-(--space-10) px-(--space-14)">
            <Label>Unrated</Label>
            <span className="text-fg-2 font-mono text-[12px]">{unrated}</span>
          </div>
        )
      )}
    </Widget>
  );
}
