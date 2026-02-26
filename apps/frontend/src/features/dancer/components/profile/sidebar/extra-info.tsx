import { Badge } from "@/components/ui/badge";
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
  MedalIcon,
  School2Icon,
  TrophyIcon,
} from "lucide-react";
import { type DancerProfile } from "../../../types";
import { useProfile } from "../context/use-profile";
import { ExtraDialog } from "../edit/extra-dialog";

interface ExtraInfoProps {
  dancer: DancerProfile;
}

export function ExtraInfo({ dancer }: ExtraInfoProps) {
  const { showOwnerControls } = useProfile();

  const noInfo =
    !dancer.trainingHours &&
    !dancer.highSchool &&
    !dancer.studio &&
    !dancer.teamLevel &&
    (!dancer.sports || dancer.sports.length === 0);

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Education & Training
          {showOwnerControls ? (
            <ExtraDialog username={dancer.username} />
          ) : (
            <div className="h-6 w-fit" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <div className="flex min-w-0 flex-col divide-y">
          {noInfo ? (
            <ExtraInfoItem
              icon={<InfoIcon className="size-4 shrink-0" />}
              label="No information"
              value="No education or training information"
            />
          ) : null}
          {dancer.trainingHours ? (
            <ExtraInfoItem
              icon={<ClockIcon className="size-4 shrink-0" />}
              label="Training Hours"
              value={`${dancer.trainingHours.toString()} hours per week`}
            />
          ) : null}
          {dancer.highSchool ? (
            <ExtraInfoItem
              icon={<GraduationCapIcon className="size-4 shrink-0" />}
              label="High School"
              value={dancer.highSchool}
            />
          ) : null}
          {dancer.studio ? (
            <ExtraInfoItem
              icon={<School2Icon className="size-4 shrink-0" />}
              label="Dance Studio"
              value={dancer.studio}
            />
          ) : null}
          {dancer.teamLevel ? (
            <ExtraInfoItem
              icon={<TrophyIcon className="size-4 shrink-0" />}
              label="Team Level"
              value={dancer.teamLevel}
            />
          ) : null}
          {dancer.sports && dancer.sports.length > 0 ? (
            <div className="hover:bg-accent/50 flex flex-col gap-2 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-brand">
                  <MedalIcon className="size-4 shrink-0" />
                </span>
                <span className="text-sm">Sports</span>
              </div>
              <div className="ml-6 flex flex-wrap gap-1.5">
                {dancer.sports.map((sport) => (
                  <Badge
                    key={sport.slug}
                    variant="brand"
                    className="rounded-full"
                  >
                    {sport.name}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
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
      <span className="text-muted-foreground ml-6 text-sm">{value}</span>
    </div>
  );
}
