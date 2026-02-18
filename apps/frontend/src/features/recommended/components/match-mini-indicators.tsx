import { LuCheck, LuX } from "react-icons/lu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/components/utils/cn";
import type { components } from "@/lib/api/types";

type RecommendedSchool =
  components["schemas"]["SchoolsRecommendedResponse"][number];

interface MatchMiniIndicatorsProps {
  school: RecommendedSchool;
  className?: string;
}

const FACTOR_COLORS = {
  skills: "bg-chart-1",
  styles: "bg-chart-2",
  sports: "bg-chart-3",
  location: "bg-chart-4",
  gpa: "bg-chart-5",
};

interface FactorDotProps {
  label: string;
  percentage: number;
  colorClass: string;
}

function FactorDot({ label, percentage, colorClass }: FactorDotProps) {
  const opacity =
    percentage === 0 ? 0.2 : percentage < 50 ? 0.5 : percentage < 80 ? 0.75 : 1;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              "size-2.5 rounded-full transition-transform hover:scale-125",
              colorClass,
            )}
            style={{ opacity }}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{label}</p>
          <p className="text-muted-foreground">{Math.round(percentage)}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MatchMiniIndicators({
  school,
  className,
}: MatchMiniIndicatorsProps) {
  const skillsPercent =
    school.totalSchoolSkills > 0
      ? (school.matchedSkillsCount / school.totalSchoolSkills) * 100
      : 0;
  const stylesPercent =
    school.totalSchoolStyles > 0
      ? (school.matchedStylesCount / school.totalSchoolStyles) * 100
      : 0;
  const sportsPercent =
    school.totalSchoolSports > 0
      ? (school.matchedSportsCount / school.totalSchoolSports) * 100
      : 0;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <FactorDot
        label="Skills"
        percentage={skillsPercent}
        colorClass={FACTOR_COLORS.skills}
      />
      <FactorDot
        label="Styles"
        percentage={stylesPercent}
        colorClass={FACTOR_COLORS.styles}
      />
      <FactorDot
        label="Sports"
        percentage={sportsPercent}
        colorClass={FACTOR_COLORS.sports}
      />
      <FactorDot
        label="Location"
        percentage={school.sameState ? 100 : 0}
        colorClass={FACTOR_COLORS.location}
      />
      <FactorDot
        label="GPA"
        percentage={school.meetsGpaRequirement ? 100 : 0}
        colorClass={FACTOR_COLORS.gpa}
      />
    </div>
  );
}

interface MatchBooleanBadgesProps {
  school: RecommendedSchool;
  className?: string;
}

export function MatchBooleanBadges({
  school,
  className,
}: MatchBooleanBadgesProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          school.sameState
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground",
        )}
      >
        {school.sameState ? (
          <LuCheck className="size-3" />
        ) : (
          <LuX className="size-3" />
        )}
        State
      </div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          school.meetsGpaRequirement
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground",
        )}
      >
        {school.meetsGpaRequirement ? (
          <LuCheck className="size-3" />
        ) : (
          <LuX className="size-3" />
        )}
        GPA
      </div>
    </div>
  );
}

interface MatchScoreBadgeProps {
  school: RecommendedSchool;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const TIER_STYLES = {
  excellent: "bg-success/10 text-success border-success/20",
  good: "bg-warning/10 text-warning-foreground border-warning/20",
  partial: "bg-info/10 text-info-foreground border-info/20",
  default: "bg-muted text-muted-foreground border-muted",
};

const sizeStyles = {
  sm: "text-xs px-1.5 py-0.5 gap-1",
  md: "text-sm px-2 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

export function MatchScoreBadge({
  school,
  className,
  size = "md",
}: MatchScoreBadgeProps) {
  const tierStyle = school.matchTier
    ? TIER_STYLES[school.matchTier]
    : TIER_STYLES.default;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-semibold tabular-nums",
        tierStyle,
        sizeStyles[size],
        className,
      )}
    >
      <span>{Math.round(school.matchScore)}</span>
      {school.matchTier && (
        <span className="font-normal capitalize opacity-75">
          {school.matchTier}
        </span>
      )}
    </div>
  );
}
