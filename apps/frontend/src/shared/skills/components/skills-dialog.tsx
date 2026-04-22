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
import { useSession } from "@/lib/session";
import type { ButtonProps } from "@base-ui/react";
import { Suspense, useCallback, useState } from "react";
import { SkillsList } from "./skills-list";
import { SkillsSummary } from "./skills-summary";
import { SkillsWeightedList } from "./skills-weighted-list";

interface SkillsDialogProps {
  selectedSkillIds: string[];
  selectedWeights?: Map<string, number>;
  onSave: (
    skillIds: string[],
    weights?: Map<string, number>,
  ) => Promise<void>;
  isPending?: boolean;
}

function SkillsDialogContentFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner label="Loading skills..." />
    </div>
  );
}

interface DancerContentProps {
  selectedSkillIds: string[];
  onToggle: (skillId: string) => void;
}

function DancerContent({ selectedSkillIds, onToggle }: DancerContentProps) {
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

interface SchoolContentProps {
  selectedSkills: Map<string, number>;
  onWeightChange: (skillId: string, weight: number | null) => void;
}

function SchoolContent({
  selectedSkills,
  onWeightChange,
}: SchoolContentProps) {
  return (
    <DialogPanel className="h-full">
      <SkillsWeightedList
        selectedSkills={selectedSkills}
        onWeightChange={onWeightChange}
      />
    </DialogPanel>
  );
}

export function SkillsDialog({
  selectedSkillIds,
  selectedWeights,
  onSave,
  isPending,
  ...props
}: SkillsDialogProps & ButtonProps) {
  const session = useSession();
  const isSchool = session.type === "school";

  const [open, setOpen] = useState(false);
  const [localSelectedSkillIds, setLocalSelectedSkillIds] =
    useState<string[]>(selectedSkillIds);
  const [localWeights, setLocalWeights] = useState<Map<string, number>>(
    () => new Map(selectedWeights),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocalSelectedSkillIds(selectedSkillIds);
      setLocalWeights(new Map(selectedWeights));
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

  const handleWeightChange = useCallback(
    (skillId: string, weight: number | null) => {
      setLocalWeights((prev) => {
        const next = new Map(prev);
        if (weight === null) {
          next.delete(skillId);
        } else {
          next.set(skillId, weight);
        }
        return next;
      });

      setLocalSelectedSkillIds((prev) => {
        if (weight === null) {
          return prev.filter((id) => id !== skillId);
        }
        if (!prev.includes(skillId)) {
          return [...prev, skillId];
        }
        return prev;
      });
    },
    [],
  );

  const handleSave = async () => {
    if (isSchool) {
      await onSave(localSelectedSkillIds, localWeights);
    } else {
      await onSave(localSelectedSkillIds);
    }
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
            Skills help us connect you with the right{" "}
            {session.type === "dancer" ? "programs" : "dancers"}
          </DialogDescription>
        </DialogHeader>

        <Suspense fallback={<SkillsDialogContentFallback />}>
          {isSchool ? (
            <SchoolContent
              selectedSkills={localWeights}
              onWeightChange={handleWeightChange}
            />
          ) : (
            <DancerContent
              selectedSkillIds={localSelectedSkillIds}
              onToggle={handleToggle}
            />
          )}
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
