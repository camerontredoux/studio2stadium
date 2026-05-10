import { cn } from "@/components/utils/cn";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";
import type { PeriodStats } from "../api/queries";

interface PeriodBreakdownTableProps {
  daily: PeriodStats;
  weekly: PeriodStats;
  monthly: PeriodStats;
}

export function PeriodBreakdownTable({
  daily,
  weekly,
  monthly,
}: PeriodBreakdownTableProps) {
  // Get all event types across all periods
  const allTypes = new Set([
    ...Object.keys(daily),
    ...Object.keys(weekly),
    ...Object.keys(monthly),
  ]);

  const rows = Array.from(allTypes)
    .map((type) => ({
      type,
      daily: daily[type] || { current: 0, previous: 0, change: null },
      weekly: weekly[type] || { current: 0, previous: 0, change: null },
      monthly: monthly[type] || { current: 0, previous: 0, change: null },
    }))
    .sort((a, b) => b.monthly.current - a.monthly.current);

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-muted-foreground py-2 text-left font-medium">
              Event Type
            </th>
            <th className="text-muted-foreground py-2 text-right font-medium">
              Daily
            </th>
            <th className="text-muted-foreground py-2 text-right font-medium">
              Weekly
            </th>
            <th className="text-muted-foreground py-2 text-right font-medium">
              Monthly
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.type} className="border-border border-b last:border-0">
              <td className="py-2.5 font-medium">
                {formatEventName(row.type)}
              </td>
              <td className="py-2.5 text-right">
                <StatCell
                  current={row.daily.current}
                  change={row.daily.change}
                />
              </td>
              <td className="py-2.5 text-right">
                <StatCell
                  current={row.weekly.current}
                  change={row.weekly.change}
                />
              </td>
              <td className="py-2.5 text-right">
                <StatCell
                  current={row.monthly.current}
                  change={row.monthly.change}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCell({
  current,
  change,
}: {
  current: number;
  change: number | null;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="tabular-nums">{current.toLocaleString()}</span>
      {change !== null && (
        <span
          className={cn(
            "flex items-center text-xs",
            change > 0 && "text-green-600 dark:text-green-500",
            change < 0 && "text-red-600 dark:text-red-500",
            change === 0 && "text-muted-foreground",
          )}
        >
          {change > 0 && <LuArrowUp className="size-3" />}
          {change < 0 && <LuArrowDown className="size-3" />}
          {change > 0 && "+"}
          {change.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

function formatEventName(type: string): string {
  return type
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}
