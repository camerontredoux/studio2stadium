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
import { outboxStatsQueries } from "./api/queries";
import { OutboxStatsChart } from "./components/outbox-stats-chart";
import { OutboxStatsList } from "./components/outbox-stats-list";
import { Suspense } from "react";

export function OutboxStatsPage() {
  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Outbox Statistics</CardTitle>
          <CardDescription>System event counts by type</CardDescription>
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
