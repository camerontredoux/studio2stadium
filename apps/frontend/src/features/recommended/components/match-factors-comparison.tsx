import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { components } from "@/lib/api/types";

type RecommendedSchool =
  components["schemas"]["SchoolsRecommendedResponse"][number];

interface MatchFactorsComparisonProps {
  schools: RecommendedSchool[];
  limit?: number;
  className?: string;
}

const FACTOR_COLORS = {
  skills: "var(--chart-1)",
  styles: "var(--chart-2)",
  sports: "var(--chart-3)",
  location: "var(--chart-4)",
  gpa: "var(--chart-5)",
};

export function MatchFactorsComparison({
  schools,
  limit = 5,
  className,
}: MatchFactorsComparisonProps) {
  const chartData = schools.slice(0, limit).map((school) => {
    const skillsRatio =
      school.totalSchoolSkills > 0
        ? (school.matchedSkillsCount / school.totalSchoolSkills) * 100
        : 0;
    const stylesRatio =
      school.totalSchoolStyles > 0
        ? (school.matchedStylesCount / school.totalSchoolStyles) * 100
        : 0;
    const sportsRatio =
      school.totalSchoolSports > 0
        ? (school.matchedSportsCount / school.totalSchoolSports) * 100
        : 0;

    return {
      name:
        school.name.length > 15
          ? school.name.slice(0, 13) + "..."
          : school.name,
      fullName: school.name,
      skills: skillsRatio,
      styles: stylesRatio,
      sports: sportsRatio,
      location: school.sameState ? 100 : 0,
      gpa: school.meetsGpaRequirement ? 100 : 0,
    };
  });

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.2 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const school = chartData.find((s) => s.name === label);
                return (
                  <div className="bg-popover text-popover-foreground border-border rounded-lg border px-4 py-3 shadow-lg">
                    <p className="mb-2 font-semibold">
                      {school?.fullName || label}
                    </p>
                    <div className="space-y-1">
                      {payload.map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-4 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block size-2.5 rounded-full"
                              style={{ backgroundColor: entry.color as string }}
                            />
                            <span className="capitalize">
                              {entry.dataKey as string}
                            </span>
                          </div>
                          <span className="font-medium tabular-nums">
                            {Math.round(entry.value as number)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ paddingTop: 16 }}
            formatter={(value) => (
              <span
                style={{ color: "var(--muted-foreground)" }}
                className="text-sm capitalize"
              >
                {value}
              </span>
            )}
          />
          <Bar
            dataKey="skills"
            fill={FACTOR_COLORS.skills}
            radius={[2, 2, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="styles"
            fill={FACTOR_COLORS.styles}
            radius={[2, 2, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="sports"
            fill={FACTOR_COLORS.sports}
            radius={[2, 2, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="location"
            fill={FACTOR_COLORS.location}
            radius={[2, 2, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="gpa"
            fill={FACTOR_COLORS.gpa}
            radius={[2, 2, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
