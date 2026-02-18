import {
  LuArrowUpRight,
  LuGraduationCap,
  LuMapPin,
  LuMusic,
  LuSparkles,
  LuTarget,
  LuTrophy,
} from "react-icons/lu";

import { cn } from "@/components/utils/cn";
import type { components } from "@/lib/api/types";

type RecommendedSchool =
  components["schemas"]["SchoolsRecommendedResponse"][number];

interface MatchSummaryStatsProps {
  schools: RecommendedSchool[];
  className?: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  colorClass?: string;
}

function StatCard({
  label,
  value,
  icon,
  subtext,
  trend,
  colorClass,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        colorClass || "border-border bg-card text-card-foreground",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-muted-foreground">{icon}</div>
        {trend === "up" && (
          <LuArrowUpRight className="text-success size-4" />
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-muted-foreground text-sm">{label}</div>
        {subtext && (
          <div className="text-muted-foreground mt-1 text-xs">{subtext}</div>
        )}
      </div>
    </div>
  );
}

export function MatchSummaryStats({
  schools,
  className,
}: MatchSummaryStatsProps) {
  const totalSchools = schools.length;
  const excellentCount = schools.filter((s) => s.matchTier === "excellent").length;
  const goodCount = schools.filter((s) => s.matchTier === "good").length;
  const sameStateCount = schools.filter((s) => s.sameState).length;
  const meetsGpaCount = schools.filter((s) => s.meetsGpaRequirement).length;

  const avgMatchScore =
    totalSchools > 0
      ? schools.reduce((sum, s) => sum + s.matchScore, 0) / totalSchools
      : 0;

  const avgSkillsMatch =
    totalSchools > 0
      ? schools.reduce((sum, s) => {
          if (s.totalSchoolSkills === 0) return sum;
          return sum + (s.matchedSkillsCount / s.totalSchoolSkills) * 100;
        }, 0) / totalSchools
      : 0;

  const avgStylesMatch =
    totalSchools > 0
      ? schools.reduce((sum, s) => {
          if (s.totalSchoolStyles === 0) return sum;
          return sum + (s.matchedStylesCount / s.totalSchoolStyles) * 100;
        }, 0) / totalSchools
      : 0;

  const avgSportsMatch =
    totalSchools > 0
      ? schools.reduce((sum, s) => {
          if (s.totalSchoolSports === 0) return sum;
          return sum + (s.matchedSportsCount / s.totalSchoolSports) * 100;
        }, 0) / totalSchools
      : 0;

  return (
    <div className={className}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Matches"
          value={totalSchools}
          icon={<LuTarget className="size-5" />}
          subtext={`${excellentCount} excellent, ${goodCount} good`}
        />
        <StatCard
          label="Avg Match Score"
          value={Math.round(avgMatchScore)}
          icon={<LuSparkles className="size-5" />}
          subtext="Out of 100"
          trend={avgMatchScore >= 70 ? "up" : "neutral"}
        />
        <StatCard
          label="In Your State"
          value={sameStateCount}
          icon={<LuMapPin className="size-5" />}
          subtext={`${Math.round((sameStateCount / totalSchools) * 100)}% of matches`}
        />
        <StatCard
          label="Meet GPA Req"
          value={meetsGpaCount}
          icon={<LuGraduationCap className="size-5" />}
          subtext={`${Math.round((meetsGpaCount / totalSchools) * 100)}% of matches`}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-muted-foreground mb-3 text-sm font-medium">
          Average Factor Matches
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <FactorMeter
            label="Skills"
            percentage={avgSkillsMatch}
            icon={<LuSparkles className="size-4" />}
            colorClass="bg-chart-1"
          />
          <FactorMeter
            label="Styles"
            percentage={avgStylesMatch}
            icon={<LuMusic className="size-4" />}
            colorClass="bg-chart-2"
          />
          <FactorMeter
            label="Sports"
            percentage={avgSportsMatch}
            icon={<LuTrophy className="size-4" />}
            colorClass="bg-chart-3"
          />
        </div>
      </div>
    </div>
  );
}

interface FactorMeterProps {
  label: string;
  percentage: number;
  icon: React.ReactNode;
  colorClass: string;
}

function FactorMeter({
  label,
  percentage,
  icon,
  colorClass,
}: FactorMeterProps) {
  return (
    <div className="bg-card text-card-foreground rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          {icon}
          {label}
        </div>
        <span className="text-lg font-semibold tabular-nums">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
