import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DailyBreakdownChartProps {
  data: { type: string; date: string; count: number }[];
}

const COLORS = [
  "hsl(221, 83%, 53%)", // blue
  "hsl(142, 71%, 45%)", // green
  "hsl(262, 83%, 58%)", // purple
  "hsl(25, 95%, 53%)", // orange
  "hsl(340, 82%, 52%)", // pink
  "hsl(187, 85%, 43%)", // cyan
  "hsl(45, 93%, 47%)", // yellow
  "hsl(0, 84%, 60%)", // red
];

export function DailyBreakdownChart({ data }: DailyBreakdownChartProps) {
  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    for (const item of data) {
      types.add(item.type);
    }
    return Array.from(types).sort();
  }, [data]);

  const [selectedType, setSelectedType] = useState<string>("all");

  const selectItems = useMemo(() => {
    return [
      { value: "all", label: "All Events" },
      ...eventTypes.map((type) => ({ value: type, label: formatEventName(type) })),
    ];
  }, [eventTypes]);

  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();

    for (const item of data) {
      const dateStr = new Date(item.date).toISOString().split("T")[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {});
      }
      const dayData = dateMap.get(dateStr)!;
      dayData[item.type] = (dayData[item.type] || 0) + item.count;
    }

    // Sort dates and build chart data
    const sortedDates = Array.from(dateMap.keys()).sort();
    return sortedDates.map((date) => {
      const dayData = dateMap.get(date)!;
      const total = Object.values(dayData).reduce((sum, v) => sum + v, 0);
      return {
        date,
        displayDate: formatDate(date),
        total,
        ...dayData,
      };
    });
  }, [data]);

  if (chartData.length === 0) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        No daily breakdown data available.
      </p>
    );
  }

  const dataKey = selectedType === "all" ? "total" : selectedType;
  const color = selectedType === "all" ? COLORS[0] : COLORS[eventTypes.indexOf(selectedType) % COLORS.length];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Daily Event Counts</h4>
        <Select value={selectedType} onValueChange={(v) => setSelectedType(v ?? "all")} items={selectItems}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {selectItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="displayDate"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={45}
            tickFormatter={(v) => v.toLocaleString()}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const value = payload[0].value as number;
                return (
                  <div className="bg-popover text-popover-foreground border-border rounded-lg border px-3 py-2 shadow-lg">
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-muted-foreground mt-1 text-sm tabular-nums">
                      {value.toLocaleString()} events
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill="url(#colorGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatEventName(type: string): string {
  return type
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
    .slice(0, 30);
}
