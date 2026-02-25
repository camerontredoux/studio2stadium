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
import type { ButtonProps } from "@base-ui/react";
import { useState } from "react";
import { SkillsList } from "./skills-list";
import { SkillsSummary } from "./skills-summary";

interface SkillsDialogProps {
  selectedSkillIds: string[];
  onSave: (skillIds: string[]) => Promise<void>;
  isPending?: boolean;
}

export function SkillsDialog({
  selectedSkillIds,
  onSave,
  isPending,
  ...props
}: SkillsDialogProps & ButtonProps) {
  const [open, setOpen] = useState(false);
  const [localSelectedSkillIds, setLocalSelectedSkillIds] =
    useState<string[]>(selectedSkillIds);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocalSelectedSkillIds(selectedSkillIds);
    }
    setOpen(nextOpen);
  };

  const handleToggle = (skillId: string) => {
    setLocalSelectedSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId],
    );
  };

  const handleSave = async () => {
    await onSave(localSelectedSkillIds);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        {...props}
        render={props.render ?? <Button variant="outline" />}
      >
        {props.children}
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-sm:h-[calc(100svh-3rem)] sm:h-200 sm:max-h-[90svh]">
        <DialogHeader>
          <DialogTitle>Dance Skills</DialogTitle>
          <DialogDescription>
            Skills help us connect you with the right programs
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="h-full">
          <SkillsList
            selectedSkillIds={localSelectedSkillIds}
            onToggle={handleToggle}
          />
        </DialogPanel>

        <SkillsSummary
          className="mx-6 mb-2 md:hidden"
          selectedSkillIds={localSelectedSkillIds}
          onRemove={handleToggle}
        />

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
