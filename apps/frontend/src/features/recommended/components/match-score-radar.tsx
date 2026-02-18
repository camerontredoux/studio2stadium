import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { components } from "@/lib/api/types";

type RecommendedSchool =
  components["schemas"]["SchoolsRecommendedResponse"][number];

interface MatchScoreRadarProps {
  school: RecommendedSchool;
  className?: string;
}

function getRadarData(school: RecommendedSchool) {
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

  return [
    { factor: "Skills", value: skillsRatio, fullMark: 100 },
    { factor: "Styles", value: stylesRatio, fullMark: 100 },
    { factor: "Sports", value: sportsRatio, fullMark: 100 },
    { factor: "Location", value: school.sameState ? 100 : 0, fullMark: 100 },
    {
      factor: "GPA",
      value: school.meetsGpaRequirement ? 100 : 0,
      fullMark: 100,
    },
  ];
}

export function MatchScoreRadar({ school, className }: MatchScoreRadarProps) {
  const data = getRadarData(school);

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid
            stroke="var(--border)"
            strokeOpacity={0.5}
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="factor"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name={school.name}
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.3}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: "var(--primary)",
              strokeWidth: 0,
            }}
            activeDot={{
              r: 6,
              fill: "var(--primary)",
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-popover text-popover-foreground border-border rounded-lg border px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium">{data.factor}</p>
                    <p className="text-muted-foreground text-sm">
                      {Math.round(data.value)}% match
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
