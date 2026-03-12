import { cn } from "@/components/utils/cn";
import { LuArrowDown, LuArrowUp, LuCalendar, LuMinus } from "react-icons/lu";
import type { PeriodStats } from "../api/queries";

interface PeriodStatsCardsProps {
  daily: PeriodStats;
  weekly: PeriodStats;
  monthly: PeriodStats;
}

export function PeriodStatsCards({
  daily,
  weekly,
  monthly,
}: PeriodStatsCardsProps) {
  const dailyTotal = sumStats(daily);
  const weeklyTotal = sumStats(weekly);
  const monthlyTotal = sumStats(monthly);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Daily Active"
        period="Last 24 hours"
        current={dailyTotal.current}
        previous={dailyTotal.previous}
        change={dailyTotal.change}
      />
      <StatCard
        label="Weekly Active"
        period="Last 7 days"
        current={weeklyTotal.current}
        previous={weeklyTotal.previous}
        change={weeklyTotal.change}
      />
      <StatCard
        label="Monthly Active"
        period="Last 30 days"
        current={monthlyTotal.current}
        previous={monthlyTotal.previous}
        change={monthlyTotal.change}
      />
    </div>
  );
}

function sumStats(stats: PeriodStats) {
  let current = 0;
  let previous = 0;
  for (const value of Object.values(stats)) {
    current += value.current;
    previous += value.previous;
  }
  const change = previous === 0 ? null : ((current - previous) / previous) * 100;
  return { current, previous, change };
}

interface StatCardProps {
  label: string;
  period: string;
  current: number;
  previous: number;
  change: number | null;
}

function StatCard({ label, period, current, previous, change }: StatCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div className="text-muted-foreground">
          <LuCalendar className="size-5" />
        </div>
        <ChangeIndicator change={change} />
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tabular-nums">
          {current.toLocaleString()}
        </div>
        <div className="text-muted-foreground text-sm">{label}</div>
        <div className="text-muted-foreground mt-1 text-xs">
          {period} (prev: {previous.toLocaleString()})
        </div>
      </div>
    </div>
  );
}

function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <span className="text-muted-foreground flex items-center gap-1 text-xs">
        <LuMinus className="size-3" />
        New
      </span>
    );
  }

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        isPositive && "text-green-600 dark:text-green-500",
        isNegative && "text-red-600 dark:text-red-500",
        !isPositive && !isNegative && "text-muted-foreground"
      )}
    >
      {isPositive && <LuArrowUp className="size-3" />}
      {isNegative && <LuArrowDown className="size-3" />}
      {isPositive && "+"}
      {change.toFixed(1)}%
    </span>
  );
}
