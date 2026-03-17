import { cn } from "@/components/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  Loader2Icon,
  MinusIcon,
  UsersIcon,
} from "lucide-react";
import { adminQueries } from "../api/queries";
import { DancersTable } from "./components/dancers-table";

export function DancersPage() {
  const search = useSearch({ from: "/_admin/(routes)/admin/dancers" });

  const { data, isPending, isPlaceholderData } = useQuery(
    adminQueries.dancers(search),
  );

  const { data: stats } = useQuery(adminQueries.dancerStats());

  if (isPending || !data) {
    return (
      <div className="flex h-24 items-center justify-center gap-2">
        <Loader2Icon className="size-4 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading dancers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dancers</h2>
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard
            icon={UsersIcon}
            label="Total Dancers"
            current={stats.total}
          />
          <StatCard
            icon={CalendarIcon}
            label="Daily Signups"
            period="Last 24 hours"
            current={stats.daily.current}
            previous={stats.daily.previous}
            change={stats.daily.change}
          />
          <StatCard
            icon={CalendarIcon}
            label="Weekly Signups"
            period="Last 7 days"
            current={stats.weekly.current}
            previous={stats.weekly.previous}
            change={stats.weekly.change}
          />
          <StatCard
            icon={CalendarIcon}
            label="Monthly Signups"
            period="Last 30 days"
            current={stats.monthly.current}
            previous={stats.monthly.previous}
            change={stats.monthly.change}
          />
        </div>
      )}
      <DancersTable
        dancers={data.dancers}
        pagination={data.pagination}
        isLoading={isPlaceholderData}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  period?: string;
  current: number;
  previous?: number;
  change?: number | null;
}

function StatCard({
  icon: Icon,
  label,
  period,
  current,
  previous,
  change,
}: StatCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border p-4">
      <div className="flex items-start justify-between">
        <div className="text-muted-foreground">
          <Icon className="size-5" />
        </div>
        {change !== undefined && <ChangeIndicator change={change} />}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tabular-nums">
          {current.toLocaleString()}
        </div>
        <div className="text-muted-foreground text-sm">{label}</div>
        {period && (
          <div className="text-muted-foreground mt-1 text-xs">
            {period}
            {previous !== undefined && ` (prev: ${previous.toLocaleString()})`}
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <span className="text-muted-foreground flex items-center gap-1 text-xs">
        <MinusIcon className="size-3" />
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
        !isPositive && !isNegative && "text-muted-foreground",
      )}
    >
      {isPositive && <ArrowUpIcon className="size-3" />}
      {isNegative && <ArrowDownIcon className="size-3" />}
      {isPositive && "+"}
      {change.toFixed(1)}%
    </span>
  );
}
