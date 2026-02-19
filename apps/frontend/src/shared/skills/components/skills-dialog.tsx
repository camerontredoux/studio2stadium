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
import { useState } from "react";
import { useSkillsByCategory } from "../hooks/use-skills-by-category";
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
}: SkillsDialogProps) {
  const skillsByCategory = useSkillsByCategory();
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
      <DialogTrigger render={<Button variant="outline" />}>
        Skills
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-sm:h-[calc(100svh-3rem)] sm:h-200 sm:max-h-[90svh]">
        <DialogHeader>
          <DialogTitle>Edit Skills</DialogTitle>
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
          skillsByCategory={skillsByCategory}
          selectedSkillIds={localSelectedSkillIds}
          onRemove={handleToggle}
        />

        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
