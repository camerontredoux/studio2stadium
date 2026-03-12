import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OutboxStat } from "../api/queries";

const COLORS = [
  "hsl(221, 83%, 53%)", // blue
  "hsl(142, 71%, 45%)", // green
  "hsl(262, 83%, 58%)", // purple
  "hsl(25, 95%, 53%)",  // orange
  "hsl(340, 82%, 52%)", // pink
  "hsl(187, 85%, 43%)", // cyan
  "hsl(45, 93%, 47%)",  // yellow
  "hsl(0, 84%, 60%)",   // red
  "hsl(280, 65%, 60%)", // violet
  "hsl(160, 60%, 45%)", // teal
];

interface OutboxStatsChartProps {
  stats: OutboxStat[];
}

export function OutboxStatsChart({ stats }: OutboxStatsChartProps) {
  const chartData = stats.map((stat, index) => ({
    name: formatEventName(stat.type),
    fullName: stat.type,
    count: stat.count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, stats.length * 40)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
      >
        <XAxis
          type="number"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: "var(--foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={180}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.3 }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-popover text-popover-foreground border-border rounded-lg border px-4 py-3 shadow-lg">
                  <p className="font-semibold">{data.fullName}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {data.count.toLocaleString()} events
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function formatEventName(type: string): string {
  return type
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
    .slice(0, 24);
}
