import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { cn } from "@/components/utils/cn";
import type { components } from "@/lib/api/types";

type RecommendedSchool =
  components["schemas"]["SchoolsRecommendedResponse"][number];

interface MatchScoreRingProps {
  school: RecommendedSchool;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const COLORS = {
  skills: "var(--chart-1)",
  styles: "var(--chart-2)",
  sports: "var(--chart-3)",
  location: "var(--chart-4)",
  gpa: "var(--chart-5)",
  remaining: "var(--muted)",
};

const TIER_COLORS = {
  excellent: "hsl(142, 76%, 36%)",
  good: "hsl(48, 96%, 53%)",
  partial: "hsl(25, 95%, 53%)",
} as const;

function getRingData(school: RecommendedSchool) {
  const skillsWeight = 25;
  const stylesWeight = 25;
  const sportsWeight = 20;
  const locationWeight = 15;
  const gpaWeight = 15;

  const skillsScore =
    school.totalSchoolSkills > 0
      ? (school.matchedSkillsCount / school.totalSchoolSkills) * skillsWeight
      : 0;
  const stylesScore =
    school.totalSchoolStyles > 0
      ? (school.matchedStylesCount / school.totalSchoolStyles) * stylesWeight
      : 0;
  const sportsScore =
    school.totalSchoolSports > 0
      ? (school.matchedSportsCount / school.totalSchoolSports) * sportsWeight
      : 0;
  const locationScore = school.sameState ? locationWeight : 0;
  const gpaScore = school.meetsGpaRequirement ? gpaWeight : 0;

  const totalScore =
    skillsScore + stylesScore + sportsScore + locationScore + gpaScore;
  const remaining = 100 - totalScore;

  return {
    data: [
      { name: "Skills", value: skillsScore, color: COLORS.skills },
      { name: "Styles", value: stylesScore, color: COLORS.styles },
      { name: "Sports", value: sportsScore, color: COLORS.sports },
      { name: "Location", value: locationScore, color: COLORS.location },
      { name: "GPA", value: gpaScore, color: COLORS.gpa },
      { name: "Remaining", value: remaining, color: COLORS.remaining },
    ].filter((d) => d.value > 0),
    totalScore,
  };
}

const sizeConfig = {
  sm: { outer: 60, inner: 45, fontSize: "text-lg" },
  md: { outer: 80, inner: 60, fontSize: "text-2xl" },
  lg: { outer: 100, inner: 75, fontSize: "text-3xl" },
};

export function MatchScoreRing({
  school,
  className,
  size = "md",
}: MatchScoreRingProps) {
  const { data, totalScore } = getRingData(school);
  const config = sizeConfig[size];
  const containerSize = config.outer * 2 + 20;

  const tierColor = school.matchTier
    ? TIER_COLORS[school.matchTier]
    : "var(--muted-foreground)";

  return (
    <div
      className={cn("relative", className)}
      style={{ width: containerSize, height: containerSize }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={config.inner}
            outerRadius={config.outer}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="outline-none"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                if (data.name === "Remaining") return null;
                return (
                  <div className="bg-popover text-popover-foreground border-border rounded-lg border px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium">{data.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {Math.round(data.value)} points
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
        <span className={cn("font-bold tabular-nums", config.fontSize)}>
          {Math.round(totalScore)}
        </span>
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: tierColor }}
        >
          {school.matchTier ?? "match"}
        </span>
      </div>
    </div>
  );
}
