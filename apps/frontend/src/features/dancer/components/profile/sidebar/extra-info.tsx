import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import {
  ClockIcon,
  GraduationCapIcon,
  InfoIcon,
  School2Icon,
  StarIcon,
  TrophyIcon,
} from "lucide-react";
import { type DancerProfile } from "../../../types";
import { useProfile } from "../context/use-profile";

interface ExtraInfoProps {
  dancer: DancerProfile;
}

export function ExtraInfo({ dancer }: ExtraInfoProps) {
  const { showOwnerControls } = useProfile();

  const noInfo =
    !dancer.trainingHours &&
    !dancer.highSchool &&
    !dancer.studio &&
    !dancer.skillLevel &&
    !dancer.teamLevel;

  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Education & Training
          {showOwnerControls ? (
            <Button size="xs">Edit</Button>
          ) : (
            <div className="h-6 w-fit" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel side="bottom">
        <div className="flex min-w-0 flex-col divide-y">
          {noInfo ? (
            <ExtraInfoItem
              icon={<InfoIcon className="size-4 shrink-0" />}
              label="No information"
              value="No education or training information"
            />
          ) : null}
          {dancer.trainingHours && (
            <ExtraInfoItem
              icon={<ClockIcon className="size-4 shrink-0" />}
              label="Training Hours"
              value={`${dancer.trainingHours.toString()} hours per week`}
            />
          )}
          {dancer.highSchool && (
            <ExtraInfoItem
              icon={<GraduationCapIcon className="size-4 shrink-0" />}
              label="High School"
              value={dancer.highSchool}
            />
          )}
          {dancer.studio && (
            <ExtraInfoItem
              icon={<School2Icon className="size-4 shrink-0" />}
              label="Dance Studio"
              value={dancer.studio}
            />
          )}
          {dancer.skillLevel && (
            <ExtraInfoItem
              icon={<StarIcon className="size-4 shrink-0" />}
              label="Skill Level"
              value={dancer.skillLevel}
            />
          )}
          {dancer.teamLevel && (
            <ExtraInfoItem
              icon={<TrophyIcon className="size-4 shrink-0" />}
              label="Team Level"
              value={dancer.teamLevel}
            />
          )}
        </div>
      </FramePanel>
    </Frame>
  );
}

function ExtraInfoItem({
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
      <span className="text-muted-foreground text-sm">{value}</span>
    </div>
  );
}
