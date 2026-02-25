import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteAchievement } from "@/features/dancer/api/mutations";
import { type ApiSchemas } from "@/lib/api/client";
import { TrashIcon, TrophyIcon } from "lucide-react";
import * as React from "react";
import { useProfile } from "../context/use-profile";
import { AchievementsDialog } from "./achievements-dialog";

type Achievement = ApiSchemas["DancersIdResponse"]["achievements"][number];

function AchievementItem({
  achievement,
  username,
  showOwnerControls,
}: {
  achievement: Achievement;
  username: string;
  showOwnerControls: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const { mutate: deleteAchievement, isPending } =
    useDeleteAchievement(username);

  const handleDelete = () => {
    deleteAchievement(
      { params: { path: { id: achievement.id } } },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <div className="hover:bg-accent/50 group flex flex-col gap-1 px-4 py-2">
      <div className="flex items-center gap-2">
        <TrophyIcon className="text-brand size-4 shrink-0" />
        <span className="flex-1 text-sm">{achievement.title}</span>
        {showOwnerControls && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="mobile:opacity-100 opacity-0 group-hover:opacity-100"
                />
              }
            >
              <TrashIcon className="text-destructive-foreground size-3.5" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Achievement</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{achievement.title}"? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose
                  render={<Button variant="outline" disabled={isPending} />}
                >
                  Cancel
                </AlertDialogClose>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={handleDelete}
                >
                  {isPending ? <Spinner label="Deleting..." /> : "Delete"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <span className="text-muted-foreground text-sm">
        {achievement.description}
      </span>
    </div>
  );
}

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
