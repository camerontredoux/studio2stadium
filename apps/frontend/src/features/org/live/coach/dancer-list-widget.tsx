import {
  HeartIcon,
  MegaphoneSimpleIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { Button } from "@/components/event/button";
import { Chip } from "@/components/event/chip";
import { RatingMeter } from "@/components/event/rating";
import { Widget } from "@/components/event/shell";
import { Stat } from "@/components/event/stat";
import { useOrg } from "@/features/org/context/use-org";
import {
  resolveMaxCallbacks,
  UNLIMITED_CALLBACKS,
} from "@/features/org/lib/max-callbacks";
import { CallbacksStatusDot } from "@/features/org/live/shared/callbacks-status-dot";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";

import {
  dancerName,
  type ScoutedDancer,
  type useCoachScouting,
} from "./coach-scouting";
import { OpenRosterButton } from "./top-ranked-widget";

type Scouting = ReturnType<typeof useCoachScouting>;

type ListDancer = Pick<
  ScoutedDancer,
  "rosterId" | "bibNumber" | "firstName" | "lastName" | "studio" | "eventId"
> & { rating: number | null };

type DancerListWidgetProps = {
  id: string;
  label: string;
  icon: PhosphorIcon;
  /** The caption after the peek's big count ("called back"). */
  caption: string;
  emptyText: string;
  rows: ListDancer[];
  labelAddon?: ReactNode;
  removeLabel: (name: string) => string;
  onRemove?: (dancer: ListDancer) => void;
  canRemove: (dancer: ListDancer) => boolean;
  footer?: ReactNode;
  ratingMax: number;
};

/** A count peek with bib chips, opening to rows of bib, name, studio, meter and Remove. */
function DancerListWidget({
  id,
  label,
  icon,
  caption,
  emptyText,
  rows,
  labelAddon,
  removeLabel,
  onRemove,
  canRemove,
  footer,
  ratingMax,
}: DancerListWidgetProps) {
  return (
    <Widget
      id={id}
      label={label}
      icon={icon}
      count={rows.length}
      labelAddon={labelAddon}
      peek={
        <>
          <Stat value={rows.length} caption={caption} />
          {rows.length > 0 && (
            <span className="bp-phone:hidden flex flex-wrap gap-(--space-4)">
              {rows.map((row) => (
                <Chip key={row.rosterId} mono className="h-[22px]">
                  {row.bibNumber ?? "–"}
                </Chip>
              ))}
            </span>
          )}
        </>
      }
    >
      {rows.map((row) => {
        const name = dancerName(row);
        return (
          <div
            key={row.rosterId}
            className="border-line-soft bp-phone:grid-cols-[36px_minmax(0,1fr)_72px_auto] bp-phone:gap-x-(--space-8) bp-phone:ps-(--space-12) grid min-h-11 grid-cols-[40px_minmax(0,1.2fr)_minmax(0,1fr)_86px_auto] items-center gap-x-(--space-12) border-b ps-(--space-14) pe-(--space-8)"
          >
            <span>
              <DancerBib dancer={row} />
            </span>
            <span className="min-w-0 truncate font-medium">{name}</span>
            <span className="text-fg-2 bp-phone:hidden min-w-0 truncate">
              {row.studio ?? "–"}
            </span>
            <RatingMeter value={row.rating ?? 0} max={ratingMax} size="row" />
            <Button
              variant="ghost"
              size="sm"
              label={removeLabel(name)}
              disabled={!onRemove || !canRemove(row)}
              onClick={() => onRemove?.(row)}
            >
              Remove
            </Button>
          </div>
        );
      })}
      {rows.length === 0 && (
        <div className="text-fg-3 flex min-h-[120px] flex-col items-center justify-center gap-(--space-10) p-(--space-16) text-center">
          <span>{emptyText}</span>
          <OpenRosterButton />
        </div>
      )}
      {footer}
    </Widget>
  );
}

type CallbackSummary = Omit<ListDancer, "rating" | "eventId">;

function withRatings(
  rows: CallbackSummary[],
  dancers: ScoutedDancer[],
  eventId: string,
): ListDancer[] {
  const byId = new Map(dancers.map((dancer) => [dancer.rosterId, dancer]));
  return rows.map((row) => ({
    ...row,
    eventId,
    rating: byId.get(row.rosterId)?.rating ?? null,
  }));
}

/**
 * The coach's callbacks for the current showcase, with the live connection mark.
 * Coaches call back as many dancers as they like; publishing keeps each coach's
 * top N by rating (`max_callbacks_per_coach`), which the footer says.
 */
export function CallbacksWidget({
  callbacks,
  dancers,
  eventId,
  scouting,
}: {
  callbacks: CallbackSummary[];
  dancers: ScoutedDancer[];
  eventId: string;
  scouting: Scouting;
}) {
  const { settings } = useOrg();
  const max = resolveMaxCallbacks(settings);
  const rows = withRatings(callbacks, dancers, eventId);

  return (
    <DancerListWidget
      id="cb"
      label="Callbacks"
      icon={MegaphoneSimpleIcon}
      caption="called back"
      emptyText="No callbacks yet"
      rows={rows}
      ratingMax={scouting.ratingMax}
      labelAddon={<CallbacksStatusDot />}
      removeLabel={(name) => `Remove ${name} from callbacks`}
      canRemove={scouting.canScoutDancer}
      onRemove={(row) =>
        void scouting.toggleCallback({
          rosterId: row.rosterId,
          isCalledBack: true,
        })
      }
      footer={
        max !== UNLIMITED_CALLBACKS &&
        rows.length > 0 && (
          <p className="type-meta text-fg-3 m-0 px-(--space-14) py-(--space-12)">
            When callbacks are published, your top {max} by rating are sent.
          </p>
        )
      }
    />
  );
}

/** With callbacks off, the board's third widget lists the coach's favourites instead. */
export function FavoritesWidget({
  dancers,
  scouting,
}: {
  dancers: ScoutedDancer[];
  scouting: Scouting;
}) {
  const rows = dancers.filter((dancer) => dancer.isFavorited);
  return (
    <DancerListWidget
      id="fav"
      label="Favorites"
      icon={HeartIcon}
      caption={rows.length === 1 ? "favorite" : "favorites"}
      emptyText="No favorites yet"
      rows={rows}
      ratingMax={scouting.ratingMax}
      removeLabel={(name) => `Remove ${name} from favorites`}
      canRemove={scouting.canScoutDancer}
      onRemove={(row) =>
        void scouting.toggleFavorite({
          rosterId: row.rosterId,
          isFavorited: true,
        })
      }
    />
  );
}
