import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import type { Achievement } from "@/features/dancer/types";
import { useProfile } from "../context/use-profile";
import { AchievementItem } from "./achievement-item";
import { AchievementsDialog } from "./achievements-dialog";

export function Achievements({
  achievements,
  username,
}: {
  achievements: Achievement[];
  username: string;
}) {
  const { showOwnerControls } = useProfile();

  return (
    <Frame className="h-fit">
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Achievements
          {showOwnerControls ? (
            <AchievementsDialog username={username} />
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <div className="flex flex-col divide-y">
          {achievements.length > 0 ? (
            achievements.map((achievement) => (
              <AchievementItem
                key={achievement.id}
                achievement={achievement}
                username={username}
                showOwnerControls={showOwnerControls}
              />
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
