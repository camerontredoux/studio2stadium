import { useReducer } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import type { SchoolProfile } from "@/features/school/types";
import {
  ClockIcon,
  DumbbellIcon,
  InfoIcon,
  SearchIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { useProfile } from "../context/use-profile";
import { TeamDialog } from "../edit/team-dialog";

interface TeamInfoProps {
  school: SchoolProfile;
}

export function TeamInfo({ school }: TeamInfoProps) {
  const { username, showOwnerControls } = useProfile();
  const noInfo =
    !school.size &&
    !school.timeCommitment &&
    !school.headCoach &&
    !school.assistantCoach &&
    !school.commonRecruiting;

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Team Information
          {showOwnerControls ? (
            <TeamDialog username={username} />
          ) : (
            <div className="h-6 w-fit" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <div className="flex min-w-0 flex-col divide-y">
          {noInfo ? (
            <TeamInfoItem
              icon={<InfoIcon className="size-4 shrink-0" />}
              label="No information"
              value="No team information available"
            />
          ) : null}
          {school.size && (
            <TeamInfoItem
              icon={<UsersIcon className="size-4 shrink-0" />}
              label="Students"
              value={`${school.size.toLocaleString()} students`}
            />
          )}
          {school.timeCommitment && (
            <TimeCommitmentItem value={school.timeCommitment} />
          )}
          {school.headCoach && (
            <TeamInfoItem
              icon={<UserIcon className="size-4 shrink-0" />}
              label="Head Coach"
              value={school.headCoach}
            />
          )}
          {school.assistantCoach && (
            <TeamInfoItem
              icon={<UserIcon className="size-4 shrink-0" />}
              label="Assistant Coach"
              value={school.assistantCoach}
            />
          )}
          {school.commonRecruiting && (
            <TeamInfoItem
              icon={<SearchIcon className="size-4 shrink-0" />}
              label="Common Recruiting"
              value="Participates in common recruiting"
            />
          )}
          {school.styles.length > 0 && (
            <div className="hover:bg-accent/50 flex flex-col gap-1 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-brand">
                  <SparklesIcon className="size-4 shrink-0" />
                </span>
                <span className="text-sm">Styles</span>
              </div>
              <div className="ml-6 flex flex-wrap gap-1.5">
                {school.styles.map((style) => (
                  <Badge
                    key={style.slug}
                    variant="brand"
                    className="rounded-full text-xs"
                  >
                    {style.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {school.sports.length > 0 && (
            <div className="hover:bg-accent/50 flex flex-col gap-1 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-brand">
                  <DumbbellIcon className="size-4 shrink-0" />
                </span>
                <span className="text-sm">Sports</span>
              </div>
              <div className="ml-6 flex flex-wrap gap-1.5">
                {school.sports.map((sport) => (
                  <Badge
                    key={sport.slug}
                    variant="brand"
                    className="rounded-full text-xs"
                  >
                    {sport.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </FramePanel>
    </Frame>
  );
}

function TeamInfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="hover:bg-accent/50 flex flex-col gap-1 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-brand">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-muted-foreground ml-6 text-sm">{value}</span>
    </div>
  );
}

function TimeCommitmentItem({ value }: { value: string }) {
  const [expanded, toggle] = useReducer((s) => !s, false);

  return (
    <div className="hover:bg-accent/50 flex flex-col gap-1 px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-brand">
          <ClockIcon className="size-4 shrink-0" />
        </span>
        <span className="text-sm">Time Commitment</span>
      </div>
      <span
        className={`text-muted-foreground ml-6 text-sm ${expanded ? "" : "line-clamp-2"}`}
      >
        {value}
      </span>
      <Button
        variant="ghost"
        size="xs"
        className="ml-auto w-fit"
        onClick={toggle}
      >
        {expanded ? "Show less" : "Show more"}
      </Button>
    </div>
  );
}
