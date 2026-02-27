import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import {
  useCreateAchievement,
  useUpdateAchievement,
} from "@/features/dancer/api/mutations";
import type { Achievement } from "@/features/dancer/types";
import { PencilIcon, PlusIcon } from "lucide-react";
import * as React from "react";
import {
  AchievementsForm,
  type AchievementFormData,
} from "./achievements-form";

interface AchievementsDialogProps {
  username: string;
  achievement?: Achievement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AchievementsDialog({
  username,
  achievement,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AchievementsDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const isEditMode = !!achievement;

  const { mutate: createAchievement, isPending: isCreating } =
    useCreateAchievement(username);
  const { mutate: updateAchievement, isPending: isUpdating } =
    useUpdateAchievement(username);

  const isPending = isCreating || isUpdating;

  const handleSubmit = (data: AchievementFormData) => {
    if (isEditMode) {
      updateAchievement(
        { params: { path: { id: achievement.id } }, body: data },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Success",
              description: "Achievement updated",
              type: "success",
            });
            setOpen(false);
          },
        },
      );
    } else {
      createAchievement(
        { body: data },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Success",
              description: "Achievement added",
              type: "success",
            });
            setOpen(false);
          },
        },
      );
    }
  };

  const defaultValues = achievement
    ? {
        title: achievement.title,
        description: achievement.description ?? "",
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger render={<Button size="icon-xs" variant="ghost" />}>
          {isEditMode ? <PencilIcon /> : <PlusIcon />}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Achievement" : "Add Achievement"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update this achievement's information."
              : "Add an award, recognition, or notable accomplishment."}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <AchievementsForm
            key={achievement?.id ?? "new"}
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
            formId="achievement-form"
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="achievement-form" disabled={isPending}>
            {isPending ? (
              <Spinner label={isEditMode ? "Saving..." : "Adding..."} />
            ) : isEditMode ? (
              "Save"
            ) : (
              "Add"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
