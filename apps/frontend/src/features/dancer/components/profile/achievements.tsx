import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { type ApiSchemas } from "@/lib/api/client";
import { PlusIcon, TrophyIcon } from "lucide-react";
import { useProfile } from "./context/use-profile";

type Achievement = ApiSchemas["DancersIdResponse"]["achievements"][number];

export function Achievements({
  achievements,
}: {
  achievements: Achievement[];
}) {
  const { showOwnerControls } = useProfile();

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Achievements
          {showOwnerControls ? (
            <Button size="icon-xs" variant="ghost">
              <PlusIcon />
            </Button>
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <div className="flex flex-col divide-y">
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <div className="hover:bg-accent/50 flex flex-col gap-1 px-4 py-2">
                <div className="flex items-center gap-2">
                  <TrophyIcon className="text-brand size-4 shrink-0" />
                  <span className="text-sm">{achievement.title}</span>
                </div>
                <span className="text-muted-foreground text-sm">
                  {achievement.description}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col gap-1 p-4">
              <span className="text-muted-foreground text-sm">
                No achievements posted
              </span>
            </div>
          )}
        </div>
      </FramePanel>
    </Frame>
  );
}
