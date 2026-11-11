import { ReorderHint, SortableList } from "@/components/shared/sortable-list";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { useReorderAchievements } from "@/features/dancer/api/mutations";
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
  const { mutate: reorder } = useReorderAchievements(username);

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
        {showOwnerControls ? <ReorderHint items={achievements} /> : null}
      </FrameHeader>
      <FramePanel className="p-0!">
        {achievements.length > 0 ? (
          <SortableList
            items={achievements}
            getId={(achievement) => achievement.id}
            getLabel={(achievement) => achievement.title}
            onReorder={
              showOwnerControls
                ? (next) =>
                    reorder({
                      body: { ids: next.map((achievement) => achievement.id) },
                    })
                : undefined
            }
            className="flex flex-col divide-y"
          >
            {(achievement, handle) => (
              <AchievementItem
                achievement={achievement}
                username={username}
                showOwnerControls={showOwnerControls}
                handle={handle}
              />
            )}
          </SortableList>
        ) : (
          <div className="flex flex-col gap-1 p-4">
            <span className="text-muted-foreground text-sm">
              No achievements posted
            </span>
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
