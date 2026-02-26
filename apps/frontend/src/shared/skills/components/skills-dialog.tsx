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
import { Suspense, useState } from "react";
import { SkillsList } from "./skills-list";
import { SkillsSummary } from "./skills-summary";

interface SkillsDialogProps {
  selectedSkillIds: string[];
  onSave: (skillIds: string[]) => Promise<void>;
  isPending?: boolean;
}

function SkillsDialogContentFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner label="Loading skills..." />
    </div>
  );
}

interface SkillsDialogContentProps {
  selectedSkillIds: string[];
  onToggle: (skillId: string) => void;
}

function SkillsDialogContent({
  selectedSkillIds,
  onToggle,
}: SkillsDialogContentProps) {
  return (
    <>
      <DialogPanel className="h-full">
        <SkillsList selectedSkillIds={selectedSkillIds} onToggle={onToggle} />
      </DialogPanel>

      <SkillsSummary
        className="mx-6 mb-2 md:hidden"
        selectedSkillIds={selectedSkillIds}
        onRemove={onToggle}
      />
    </>
  );
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

        <Suspense fallback={<SkillsDialogContentFallback />}>
          <SkillsDialogContent
            selectedSkillIds={localSelectedSkillIds}
            onToggle={handleToggle}
          />
        </Suspense>

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
