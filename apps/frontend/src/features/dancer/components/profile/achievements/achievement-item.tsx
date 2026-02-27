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
import { Spinner } from "@/components/ui/spinner";
import { useDeleteAchievement } from "@/features/dancer/api/mutations";
import type { Achievement } from "@/features/dancer/types";
import { PencilIcon, TrashIcon, TrophyIcon } from "lucide-react";
import * as React from "react";
import { AchievementsDialog } from "./achievements-dialog";

export function AchievementItem({
  achievement,
  username,
  showOwnerControls,
}: {
  achievement: Achievement;
  username: string;
  showOwnerControls: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const { mutate: deleteAchievement, isPending } =
    useDeleteAchievement(username);

  const handleDelete = () => {
    deleteAchievement(
      { params: { path: { id: achievement.id } } },
      { onSuccess: () => setDeleteOpen(false) },
    );
  };

  return (
    <div className="hover:bg-accent/50 group flex flex-col gap-1 px-4 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <TrophyIcon className="text-brand size-4 shrink-0" />
        <span className="flex-1 truncate text-sm">{achievement.title}</span>
        {showOwnerControls ? (
          <div className="flex gap-1">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setEditOpen(true)}
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <AchievementsDialog
              username={username}
              achievement={achievement}
              open={editOpen}
              onOpenChange={setEditOpen}
            />
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger
                render={<Button size="icon-xs" variant="ghost" />}
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
          </div>
        ) : (
          <div className="h-7 w-fit sm:h-6" />
        )}
      </div>
      <span className="text-muted-foreground ml-6 text-sm">
        {achievement.description}
      </span>
    </div>
  );
}
