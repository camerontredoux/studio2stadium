import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { components } from "@/lib/api/types";

type RecommendedSchool =
  components["schemas"]["SchoolsRecommendedResponse"][number];

interface TopSchoolsChartProps {
  schools: RecommendedSchool[];
  limit?: number;
  className?: string;
}

const TIER_COLORS = {
  excellent: "hsl(142, 76%, 36%)",
  good: "hsl(48, 96%, 53%)",
  partial: "hsl(25, 95%, 53%)",
  default: "var(--muted-foreground)",
};

function getBarColor(tier: RecommendedSchool["matchTier"]) {
  if (!tier) return TIER_COLORS.default;
  return TIER_COLORS[tier];
}

export function TopSchoolsChart({
  schools,
  limit = 10,
  className,
}: TopSchoolsChartProps) {
  const chartData = schools.slice(0, limit).map((school) => ({
    name: school.name.length > 20 ? school.name.slice(0, 18) + "..." : school.name,
    fullName: school.name,
    score: school.matchScore,
    tier: school.matchTier,
    username: school.username,
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={Math.max(300, limit * 40)}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
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
            width={150}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.3 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover text-popover-foreground border-border rounded-lg border px-4 py-3 shadow-lg">
                    <p className="font-semibold">{data.fullName}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: getBarColor(data.tier) }}
                      />
                      <span className="text-muted-foreground text-sm">
                        {Math.round(data.score)} match score
                      </span>
                    </div>
                    {data.tier && (
                      <p className="text-muted-foreground mt-1 text-xs capitalize">
                        {data.tier} match
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="score"
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.tier)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
