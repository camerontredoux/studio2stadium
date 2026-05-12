import { cn } from "@/components/utils/cn";
import type { RosterStatus } from "@/features/org/api/roster-queries";

export interface RosterPageHeaderStats {
  total: number;
  /** Rows where userId IS NOT NULL */
  activated: number;
  pending: number;
  orgCount?: number;
}

export interface RosterPageHeaderProps {
  title: string;
  eventName: string;
  stats: RosterPageHeaderStats;
  isLoading?: boolean;
  status: RosterStatus;
  onStatusChange: (status: RosterStatus) => void;
}

export function RosterPageHeader({
  title,
  eventName,
  stats,
  isLoading = false,
  status,
  onStatusChange,
}: RosterPageHeaderProps) {
  const activationPct =
    stats.total === 0 ? 0 : Math.round((stats.activated / stats.total) * 100);

  return (
    <section aria-label={`${title} header`}>
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight 2xl:text-xl">
            {title}
          </h1>
          <span className="text-muted-foreground text-xs tabular-nums 2xl:text-sm">
            {eventName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm 2xl:text-base">
            <span className="font-semibold tabular-nums">
              {isLoading ? "–" : stats.activated.toLocaleString()}
            </span>
            <span className="text-muted-foreground">
              /{isLoading ? "–" : stats.total.toLocaleString()} activated
            </span>
          </div>
          <div
            className="bg-border h-0.5 w-[120px] overflow-hidden"
            role="progressbar"
            aria-valuenow={activationPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Roster activation progress"
          >
            <div
              className="bg-foreground h-full"
              style={{ width: `${activationPct}%` }}
            />
          </div>
          <span className="text-muted-foreground text-[11px] tabular-nums 2xl:text-xs">
            {activationPct}%
          </span>
        </div>
      </header>

      <div
        aria-label="Roster stats and status filter"
        className="border-border flex items-stretch border-y"
      >
        <FilterStatCell
          label="Total"
          value={stats.total}
          isLoading={isLoading}
          active={status === "all"}
          onClick={() => onStatusChange("all")}
        />
        <FilterStatCell
          label="Activated"
          value={stats.activated}
          isLoading={isLoading}
          active={status === "active"}
          onClick={() => onStatusChange("active")}
        />
        <FilterStatCell
          label="Pending"
          value={stats.pending}
          isLoading={isLoading}
          active={status === "pending"}
          onClick={() => onStatusChange("pending")}
        />
        {stats.orgCount !== undefined && (
          <ReadOnlyStatCell
            label="Orgs"
            value={stats.orgCount}
            isLoading={isLoading}
          />
        )}
      </div>
    </section>
  );
}

interface FilterStatCellProps {
  label: string;
  value: number;
  isLoading: boolean;
  active: boolean;
  onClick: () => void;
}

function FilterStatCell({
  label,
  value,
  isLoading,
  active,
  onClick,
}: FilterStatCellProps) {
  return (
    <button
      type="button"
      data-active={active || undefined}
      onClick={onClick}
      className={cn(
        "border-border relative flex flex-1 cursor-pointer flex-col justify-center gap-1 border-l px-4 py-3 text-left transition-colors first:border-l-0",
        "hover:bg-muted/30",
        "before:bg-foreground before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:opacity-0 before:transition-opacity",
        active && "before:opacity-100",
      )}
    >
      <span className="text-2xl leading-none font-semibold tracking-tight tabular-nums 2xl:text-3xl">
        {isLoading ? "–" : value.toLocaleString()}
      </span>
      <span
        className={cn(
          "text-[10px] font-medium tracking-widest uppercase transition-colors 2xl:text-xs",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}

interface ReadOnlyStatCellProps {
  label: string;
  value: number;
  isLoading: boolean;
}

function ReadOnlyStatCell({ label, value, isLoading }: ReadOnlyStatCellProps) {
  return (
    <div className="border-border flex flex-1 flex-col justify-center gap-1 border-l px-4 py-3">
      <span className="text-2xl leading-none font-semibold tracking-tight tabular-nums 2xl:text-3xl">
        {isLoading ? "–" : value.toLocaleString()}
      </span>
      <span className="text-muted-foreground/80 text-[10px] font-medium tracking-widest uppercase 2xl:text-xs">
        {label}
      </span>
    </div>
  );
}
