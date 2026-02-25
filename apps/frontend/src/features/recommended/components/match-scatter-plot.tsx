import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import type { components } from "@/lib/api/types";

type RecommendedSchool =
  components["schemas"]["SchoolsRecommendedResponse"][number];

interface MatchScatterPlotProps {
  schools: RecommendedSchool[];
  className?: string;
  xAxis?: "skills" | "styles" | "sports";
  yAxis?: "skills" | "styles" | "sports";
}

const TIER_COLORS = {
  excellent: "hsl(142, 76%, 36%)",
  good: "hsl(48, 96%, 53%)",
  partial: "hsl(25, 95%, 53%)",
  none: "var(--muted-foreground)",
};

const AXIS_LABELS = {
  skills: "Skills Match %",
  styles: "Styles Match %",
  sports: "Sports Match %",
};

function getFactorPercentage(
  school: RecommendedSchool,
  factor: "skills" | "styles" | "sports",
): number {
  switch (factor) {
    case "skills":
      return school.totalSchoolSkills > 0
        ? (school.matchedSkillsCount / school.totalSchoolSkills) * 100
        : 0;
    case "styles":
      return school.totalSchoolStyles > 0
        ? (school.matchedStylesCount / school.totalSchoolStyles) * 100
        : 0;
    case "sports":
      return school.totalSchoolSports > 0
        ? (school.matchedSportsCount / school.totalSchoolSports) * 100
        : 0;
  }
}

export function MatchScatterPlot({
  schools,
  className,
  xAxis = "skills",
  yAxis = "styles",
}: MatchScatterPlotProps) {
  const chartData = schools.map((school) => ({
    x: getFactorPercentage(school, xAxis),
    y: getFactorPercentage(school, yAxis),
    z: school.matchScore,
    name: school.name,
    tier: school.matchTier,
    location: school.location,
    sameState: school.sameState,
    meetsGpa: school.meetsGpaRequirement,
  }));

  const excellent = chartData.filter((d) => d.tier === "excellent");
  const good = chartData.filter((d) => d.tier === "good");
  const partial = chartData.filter((d) => d.tier === "partial");
  const none = chartData.filter((d) => !d.tier);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.5}
          />
          <XAxis
            type="number"
            dataKey="x"
            name={AXIS_LABELS[xAxis]}
            domain={[0, 100]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: AXIS_LABELS[xAxis],
              position: "bottom",
              fill: "var(--muted-foreground)",
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={AXIS_LABELS[yAxis]}
            domain={[0, 100]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: AXIS_LABELS[yAxis],
              angle: -90,
              position: "insideLeft",
              fill: "var(--muted-foreground)",
              fontSize: 12,
            }}
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover text-popover-foreground border-border rounded-lg border px-4 py-3 shadow-lg">
                    <p className="font-semibold">{data.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {data.location}
                    </p>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          {AXIS_LABELS[xAxis]}
                        </span>
                        <span className="font-medium tabular-nums">
                          {Math.round(data.x)}%
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          {AXIS_LABELS[yAxis]}
                        </span>
                        <span className="font-medium tabular-nums">
                          {Math.round(data.y)}%
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          Match Score
                        </span>
                        <span className="font-medium tabular-nums">
                          {Math.round(data.z)}
                        </span>
                      </div>
                    </div>
                    {data.tier && (
                      <div
                        className="mt-2 rounded px-2 py-1 text-center text-xs font-medium capitalize"
                        style={{
                          backgroundColor:
                            TIER_COLORS[data.tier as keyof typeof TIER_COLORS] +
                            "20",
                          color:
                            TIER_COLORS[data.tier as keyof typeof TIER_COLORS],
                        }}
                      >
                        {data.tier} match
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          {excellent.length > 0 && (
            <Scatter
              name="Excellent"
              data={excellent}
              fill={TIER_COLORS.excellent}
            />
          )}
          {good.length > 0 && (
            <Scatter name="Good" data={good} fill={TIER_COLORS.good} />
          )}
          {partial.length > 0 && (
            <Scatter name="Partial" data={partial} fill={TIER_COLORS.partial} />
          )}
          {none.length > 0 && (
            <Scatter name="Unranked" data={none} fill={TIER_COLORS.none} />
          )}
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {[
          { tier: "excellent", label: "Excellent" },
          { tier: "good", label: "Good" },
          { tier: "partial", label: "Partial" },
          { tier: "none", label: "Unranked" },
        ].map(({ tier, label }) => (
          <div key={tier} className="flex items-center gap-2">
            <span
              className="size-3 rounded-full"
              style={{
                backgroundColor: TIER_COLORS[tier as keyof typeof TIER_COLORS],
              }}
            />
            <span
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
