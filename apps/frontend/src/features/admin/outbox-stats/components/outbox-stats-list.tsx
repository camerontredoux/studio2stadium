import type { OutboxStat } from "../api/queries";

interface OutboxStatsListProps {
  stats: OutboxStat[];
}

export function OutboxStatsList({ stats }: OutboxStatsListProps) {
  const sortedStats = [...stats].sort((a, b) => b.count - a.count);

  return (
    <ul className="divide-border divide-y">
      {sortedStats.map((stat) => (
        <li
          key={stat.type}
          className="flex items-center justify-between gap-4 py-3"
        >
          <span className="text-sm font-medium">{formatEventName(stat.type)}</span>
          <span className="text-muted-foreground tabular-nums">
            {stat.count.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}

function formatEventName(type: string): string {
  return type
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}
