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
import { useState } from "react";
import { StylesList } from "./styles-list";

interface SkillsDialogProps {
  selectedStyleIds: string[];
  onSave: (skillIds: string[]) => Promise<void>;
  isPending?: boolean;
  render: React.ReactElement;
}

export function StylesDialog({
  selectedStyleIds,
  onSave,
  isPending,
  render,
}: SkillsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localSelectedSkillIds, setLocalSelectedSkillIds] =
    useState<string[]>(selectedStyleIds);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocalSelectedSkillIds(selectedStyleIds);
    }
    setOpen(nextOpen);
  };

  const handleToggle = (styleId: string) => {
    setLocalSelectedSkillIds((prev) =>
      prev.includes(styleId)
        ? prev.filter((id) => id !== styleId)
        : [...prev, styleId],
    );
  };

  const handleSave = async () => {
    await onSave(localSelectedSkillIds);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger nativeButton={false} render={render} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dance Styles</DialogTitle>
          <DialogDescription>
            Select your top 3 styles to help us recommend the right programs
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="h-full">
          <StylesList
            onToggle={handleToggle}
            selectedStyleIds={localSelectedSkillIds}
          />
        </DialogPanel>

        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Spinner label="Saving..." /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
