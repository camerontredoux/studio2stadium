import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { components } from "@/lib/api/types";

type RecommendedSchool =
  components["schemas"]["SchoolsRecommendedResponse"][number];
type MatchTier = NonNullable<RecommendedSchool["matchTier"]>;

interface TierDistributionProps {
  schools: RecommendedSchool[];
  className?: string;
}

const TIER_CONFIG: Record<
  MatchTier | "none",
  { label: string; color: string; description: string }
> = {
  excellent: {
    label: "Excellent",
    color: "hsl(142, 76%, 36%)",
    description: "High compatibility across all factors",
  },
  good: {
    label: "Good",
    color: "hsl(48, 96%, 53%)",
    description: "Strong match with room for growth",
  },
  partial: {
    label: "Partial",
    color: "hsl(25, 95%, 53%)",
    description: "Some matching factors found",
  },
  none: {
    label: "Unranked",
    color: "var(--muted-foreground)",
    description: "New or limited data",
  },
};

export function TierDistribution({
  schools,
  className,
}: TierDistributionProps) {
  const tierCounts = schools.reduce(
    (acc, school) => {
      const tier = school.matchTier ?? "none";
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    },
    {} as Record<MatchTier | "none", number>,
  );

  const data = (Object.keys(TIER_CONFIG) as (MatchTier | "none")[])
    .filter((tier) => tierCounts[tier] > 0)
    .map((tier) => ({
      name: TIER_CONFIG[tier].label,
      value: tierCounts[tier],
      color: TIER_CONFIG[tier].color,
      description: TIER_CONFIG[tier].description,
    }));

  const total = schools.length;

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative h-[180px] w-[180px] shrink-0 sm:h-[200px] sm:w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = ((data.value / total) * 100).toFixed(1);
                    return (
                      <div className="bg-popover text-popover-foreground border-border rounded-lg border px-3 py-2 shadow-lg">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {data.value} schools ({percentage}%)
                        </p>
                        <p className="text-muted-foreground mt-1 max-w-[200px] text-xs">
                          {data.description}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold sm:text-3xl">{total}</span>
            <span className="text-muted-foreground text-xs">schools</span>
          </div>
        </div>

        <div className="w-full min-w-0 flex-1 space-y-3">
          {data.map((tier) => {
            const percentage = ((tier.value / total) * 100).toFixed(0);
            return (
              <div key={tier.name} className="flex items-center gap-3">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {tier.name}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                      {tier.value} ({percentage}%)
                    </span>
                  </div>
                  <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: tier.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
