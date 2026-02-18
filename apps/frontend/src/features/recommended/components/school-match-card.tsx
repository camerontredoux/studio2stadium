import {
  LuCheck,
  LuGraduationCap,
  LuMapPin,
  LuMusic,
  LuSparkles,
  LuTrophy,
  LuX,
} from "react-icons/lu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress";
import { cn } from "@/components/utils/cn";
import type { components } from "@/lib/api/types";

type RecommendedSchool =
  components["schemas"]["SchoolsRecommendedResponse"][number];

interface SchoolMatchCardProps {
  school: RecommendedSchool;
  className?: string;
  onViewProfile?: (username: string) => void;
}

const TIER_STYLES = {
  excellent: {
    badge: "success" as const,
    ring: "ring-success/30",
    bg: "bg-success/5",
  },
  good: {
    badge: "warning" as const,
    ring: "ring-warning/30",
    bg: "bg-warning/5",
  },
  partial: {
    badge: "info" as const,
    ring: "ring-info/30",
    bg: "bg-info/5",
  },
  unqualified: {
    badge: "destructive" as const,
    ring: "ring-destructive/30",
    bg: "bg-destructive/5",
  },
};

interface MatchFactorProps {
  label: string;
  icon: React.ReactNode;
  matched: number;
  total: number;
  colorClass: string;
}

function MatchFactor({
  label,
  icon,
  matched,
  total,
  colorClass,
}: MatchFactorProps) {
  const percentage = total > 0 ? (matched / total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-medium tabular-nums">
          {matched}/{total}
        </span>
      </div>
      <Progress value={percentage}>
        <ProgressTrack className="h-2">
          <ProgressIndicator className={cn("rounded-full", colorClass)} />
        </ProgressTrack>
      </Progress>
    </div>
  );
}

interface BooleanFactorProps {
  label: string;
  icon: React.ReactNode;
  met: boolean;
}

function BooleanFactor({ label, icon, met }: BooleanFactorProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      {met ? (
        <div className="text-success flex items-center gap-1 text-sm font-medium">
          <LuCheck className="size-4" />
          Met
        </div>
      ) : (
        <div className="text-muted-foreground flex items-center gap-1 text-sm">
          <LuX className="size-4" />
          Not met
        </div>
      )}
    </div>
  );
}

export function SchoolMatchCard({
  school,
  className,
  onViewProfile,
}: SchoolMatchCardProps) {
  const tierStyle = school.matchTier
    ? TIER_STYLES[school.matchTier]
    : { badge: "outline" as const, ring: "", bg: "" };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-md",
        tierStyle.bg,
        className,
      )}
    >
      <CardHeader className="overflow-hidden">
        <div className="flex items-start gap-3 overflow-hidden">
          <Avatar
            className={cn(
              "size-12 shrink-0 ring-2 ring-offset-2",
              tierStyle.ring,
            )}
          >
            {school.avatar && <AvatarImage src={school.avatar} />}
            <AvatarFallback className="bg-muted text-sm font-semibold">
              {school.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div
                className="min-w-0 overflow-hidden"
                style={{ flex: "1 1 0" }}
              >
                <CardTitle
                  className="cursor-pointer truncate text-base hover:underline"
                  onClick={() => onViewProfile?.(school.username)}
                >
                  {school.name}
                </CardTitle>
                <CardDescription className="mt-0.5 flex items-center gap-1">
                  <LuMapPin className="size-3 shrink-0" />
                  <span className="truncate">{school.location}</span>
                </CardDescription>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-2xl font-bold tabular-nums">
                  {Math.round(school.matchScore)}
                </div>
                <div className="text-muted-foreground text-xs">score</div>
              </div>
            </div>
            {school.matchTier && (
              <Badge variant={tierStyle.badge} size="sm" className="mt-2">
                {school.matchTier}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <MatchFactor
            label="Skills"
            icon={<LuSparkles className="size-4" />}
            matched={school.matchedSkillsCount}
            total={school.totalSchoolSkills}
            colorClass="bg-chart-1"
          />
          <MatchFactor
            label="Styles"
            icon={<LuMusic className="size-4" />}
            matched={school.matchedStylesCount}
            total={school.totalSchoolStyles}
            colorClass="bg-chart-2"
          />
          <MatchFactor
            label="Sports"
            icon={<LuTrophy className="size-4" />}
            matched={school.matchedSportsCount}
            total={school.totalSchoolSports}
            colorClass="bg-chart-3"
          />
        </div>

        <div className="border-border space-y-1 border-t pt-3">
          <BooleanFactor
            label="Same State"
            icon={<LuMapPin className="size-4" />}
            met={school.sameState}
          />
          <BooleanFactor
            label="GPA Requirement"
            icon={<LuGraduationCap className="size-4" />}
            met={school.meetsGpaRequirement}
          />
        </div>
      </CardContent>
    </Card>
  );
}
