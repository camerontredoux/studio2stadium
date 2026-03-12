import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/components/hooks/use-mobile";
import { useSuspenseQuery } from "@tanstack/react-query";
import { outboxStatsQueries, type PeriodStats } from "./api/queries";
import { OutboxStatsChart } from "./components/outbox-stats-chart";
import { OutboxStatsList } from "./components/outbox-stats-list";
import { PeriodStatsCards } from "./components/period-stats-cards";
import { PeriodBreakdownTable } from "./components/period-breakdown-table";
import { DailyBreakdownChart } from "./components/daily-breakdown-chart";
import { Suspense } from "react";

export function OutboxStatsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<Spinner label="Loading history..." />}>
        <HistoryStatsContent />
      </Suspense>

      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Current Statistics</CardTitle>
          <CardDescription>Total event counts by type</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Spinner label="Loading stats..." />}>
            <OutboxStatsContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryStatsContent() {
  const { data } = useSuspenseQuery(outboxStatsQueries.history());

  const daily = (data.daily || {}) as PeriodStats;
  const weekly = (data.weekly || {}) as PeriodStats;
  const monthly = (data.monthly || {}) as PeriodStats;
  const dailyBreakdown = data.dailyBreakdown || [];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PeriodStatsCards daily={daily} weekly={weekly} monthly={monthly} />

      <Card>
        <CardHeader>
          <CardTitle>Activity Trends</CardTitle>
          <CardDescription>Event counts over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <DailyBreakdownChart data={dailyBreakdown} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Period Comparison</CardTitle>
          <CardDescription>
            Event breakdown with change from previous period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PeriodBreakdownTable
            daily={daily}
            weekly={weekly}
            monthly={monthly}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function OutboxStatsContent() {
  const { data: stats } = useSuspenseQuery(outboxStatsQueries.stats());
  const isMobile = useIsMobile();

  if (!stats || stats.length === 0) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        No outbox events found.
      </p>
    );
  }

  if (isMobile) {
    return <OutboxStatsList stats={stats} />;
  }

  return <OutboxStatsChart stats={stats} />;
}
