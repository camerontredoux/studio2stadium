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
import { useSkillsByCategory } from "../hooks/use-skills-by-category";
import { SkillsList } from "./skills-list";
import { SkillsSummary } from "./skills-summary";

interface SkillsDialogProps {
  selectedSkillIds: string[];
  onToggle: (skillId: string) => void;
}

export function SkillsDialog({
  selectedSkillIds,
  onToggle,
}: SkillsDialogProps) {
  const skillsByCategory = useSkillsByCategory();

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Skills
      </DialogTrigger>
      <DialogContent className="h-[80svh] max-w-7xl">
        <DialogHeader>
          <DialogTitle>Edit Skills</DialogTitle>
          <DialogDescription>
            Skills help us connect you with the right programs
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="h-full">
          <SkillsList selectedSkillIds={selectedSkillIds} onToggle={onToggle} />
        </DialogPanel>

        <SkillsSummary
          className="mx-6 mb-2 md:hidden"
          skillsByCategory={skillsByCategory}
          selectedSkillIds={selectedSkillIds}
          onRemove={onToggle}
        />

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
