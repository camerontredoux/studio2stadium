import {
  HeartIcon,
  MegaphoneSimpleIcon,
  TrashIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { Button } from "@/components/event/button";
import { Chip } from "@/components/event/chip";
import { Icon } from "@/components/event/icon";
import { RatingMeter } from "@/components/event/rating";
import { Widget } from "@/components/event/shell";
import { Stat } from "@/components/event/stat";
import { Tag } from "@/components/event/tag";
import { useOrg } from "@/features/org/context/use-org";
import {
  resolveMaxCallbacks,
  UNLIMITED_CALLBACKS,
} from "@/features/org/lib/max-callbacks";
import { CallbacksStatusDot } from "@/features/org/live/shared/callbacks-status-dot";
import { PersonAvatar } from "@/features/org/live/shared/person-avatar";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";
import type { ApiSchemas } from "@/lib/api/client";

import {
  dancerName,
  type ScoutedDancer,
  type useCoachScouting,
} from "./coach-scouting";
import { BibLabel, OpenRosterButton } from "./top-ranked-widget";

type Scouting = ReturnType<typeof useCoachScouting>;

type ListDancer = Pick<
  ScoutedDancer,
  | "rosterId"
  | "bibNumber"
  | "firstName"
  | "lastName"
  | "studio"
  | "eventId"
  | "profilePhotoUrl"
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
            <span className="flex min-w-0 items-center gap-(--space-8)">
              <PersonAvatar
                firstName={row.firstName}
                lastName={row.lastName}
                src={row.profilePhotoUrl}
                className="size-6"
              />
              <span className="min-w-0 truncate font-medium">{name}</span>
            </span>
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

type CallbackSummary = Omit<ListDancer, "eventId">;

type HistoryShowcase =
  ApiSchemas["OrgsIdCallbacksHistoryResponse"]["showcases"][number];

/**
 * One callbacks row: bib, name and read-only stars, then the trash button on
 * the current showcase. Earlier showcases keep the button's column empty so
 * every row lines up.
 */
function CallbackRow({
  dancer,
  ratingMax,
  onRemove,
}: {
  dancer: Pick<
    ListDancer,
    | "rosterId"
    | "bibNumber"
    | "firstName"
    | "lastName"
    | "rating"
    | "profilePhotoUrl"
  >;
  ratingMax: number;
  onRemove?: { label: string; disabled: boolean; run: () => void };
}) {
  return (
    <div className="border-line-soft bp-phone:ps-(--space-12) grid min-h-11 grid-cols-[64px_minmax(0,1fr)_auto_28px] items-center gap-x-(--space-12) border-b ps-(--space-14) pe-(--space-8)">
      <BibLabel bib={dancer.bibNumber} />
      <span className="flex min-w-0 items-center gap-(--space-8)">
        <PersonAvatar
          firstName={dancer.firstName}
          lastName={dancer.lastName}
          src={dancer.profilePhotoUrl}
          className="size-6"
        />
        <span className="text-fg min-w-0 truncate font-medium">
          {dancerName(dancer)}
        </span>
      </span>
      <RatingMeter value={dancer.rating ?? 0} max={ratingMax} size="row" />
      {onRemove ? (
        <Button
          size="sm"
          iconOnly
          label={onRemove.label}
          disabled={onRemove.disabled}
          onClick={onRemove.run}
        >
          <Icon icon={TrashIcon} />
        </Button>
      ) : (
        <span />
      )}
    </div>
  );
}

/** A showcase's head: "Showcase 3", the Current tag on the active one, and its count. */
function ShowcaseHead({
  number,
  current,
  count,
}: {
  number: number | undefined;
  current: boolean;
  count: number;
}) {
  return (
    <div className="bg-surface-head border-line-soft flex min-h-10 items-center gap-(--space-10) border-b ps-(--space-14) pe-(--space-14)">
      <span className="text-fg text-[13px] font-medium">
        {number !== undefined ? `Showcase ${number}` : "Current showcase"}
      </span>
      {current && <Tag tone="live">Current</Tag>}
      <span className="text-fg-2 ms-auto font-mono text-[12px] tabular-nums">
        {count}
      </span>
    </div>
  );
}

/**
 * The coach's callbacks with the live connection mark, by showcase: the
 * current showcase first, where each callback can be removed, then what each
 * earlier showcase sent, read-only. Coaches call back as many dancers as they
 * like; publishing keeps each coach's top N by rating
 * (`max_callbacks_per_coach`), which the footer says.
 */
export function CallbacksWidget({
  callbacks,
  history,
  eventId,
  scouting,
}: {
  /** The current showcase's callbacks, kept live by the coach's own marks. */
  callbacks: CallbackSummary[];
  /** Every showcase of the event with what it sent; `undefined` while loading. */
  history: HistoryShowcase[] | undefined;
  eventId: string;
  scouting: Scouting;
}) {
  const { settings } = useOrg();
  const max = resolveMaxCallbacks(settings);
  const current = history?.find((showcase) => showcase.isCurrent);
  const earlier = history?.filter((showcase) => !showcase.isCurrent) ?? [];
  const editable = scouting.canScoutDancer({ eventId });

  return (
    <Widget
      id="cb"
      label="Callbacks"
      icon={MegaphoneSimpleIcon}
      count={callbacks.length}
      labelAddon={<CallbacksStatusDot />}
      peek={
        <>
          <Stat value={callbacks.length} caption="called back" />
          {callbacks.length > 0 && (
            <span className="bp-phone:hidden flex flex-wrap gap-(--space-4)">
              {callbacks.map((row) => (
                <Chip key={row.rosterId} mono className="h-[22px]">
                  {row.bibNumber ?? "–"}
                </Chip>
              ))}
            </span>
          )}
        </>
      }
    >
      <section aria-label="Current showcase">
        <ShowcaseHead
          number={current?.number}
          current
          count={callbacks.length}
        />
        {callbacks.map((row) => {
          const name = dancerName(row);
          return (
            <CallbackRow
              key={row.rosterId}
              dancer={row}
              ratingMax={scouting.ratingMax}
              onRemove={{
                label: `Remove ${name} from callbacks`,
                disabled: !editable,
                run: () =>
                  void scouting.toggleCallback({
                    rosterId: row.rosterId,
                    isCalledBack: true,
                  }),
              }}
            />
          );
        })}
        {callbacks.length === 0 && (
          <div className="text-fg-3 border-line-soft flex min-h-11 items-center gap-(--space-10) border-b ps-(--space-14) pe-(--space-8)">
            <span className="flex-1">No callbacks yet</span>
            <OpenRosterButton />
          </div>
        )}
        {max !== UNLIMITED_CALLBACKS && callbacks.length > 0 && (
          <p className="type-meta text-fg-3 border-line-soft m-0 border-b px-(--space-14) py-(--space-12)">
            When callbacks are published, your top {max} by rating are sent.
          </p>
        )}
      </section>
      {earlier.map((showcase) => (
        <section key={showcase.id} aria-label={`Showcase ${showcase.number}`}>
          <ShowcaseHead
            number={showcase.number}
            current={false}
            count={showcase.callbacks.length}
          />
          {showcase.callbacks.map((row) => (
            <CallbackRow
              key={row.rosterId}
              dancer={row}
              ratingMax={scouting.ratingMax}
            />
          ))}
          {showcase.callbacks.length === 0 && (
            <div className="text-fg-3 border-line-soft flex min-h-11 items-center border-b px-(--space-14)">
              No callbacks sent
            </div>
          )}
        </section>
      ))}
    </Widget>
  );
}

/** With callbacks off, the board's third widget lists the coach's favourites instead. */
export function FavoritesWidget({
  favorites: rows,
  scouting,
}: {
  favorites: ScoutedDancer[];
  scouting: Scouting;
}) {
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
