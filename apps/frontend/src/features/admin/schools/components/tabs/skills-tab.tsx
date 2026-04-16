import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useAdminUpdateSchoolSkills } from "@/features/admin/api/mutations";
import { SkillsList } from "@/shared/skills/components/skills-list";
import {
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { TabHandle } from "./types";

interface SkillsTabProps {
  username: string;
  selectedSkillIds: string[];
  onStateChange: (state: { isDirty: boolean; isPending: boolean }) => void;
}

function SkillsTabFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner label="Loading skills..." />
    </div>
  );
}

export const SkillsTab = forwardRef<TabHandle, SkillsTabProps>(
  function SkillsTab({ username, selectedSkillIds, onStateChange }, ref) {
    const [localSelectedSkillIds, setLocalSelectedSkillIds] =
      useState<string[]>(selectedSkillIds);
    const { mutate, isPending } = useAdminUpdateSchoolSkills();

    const handleToggle = (skillId: string) => {
      setLocalSelectedSkillIds((prev) =>
        prev.includes(skillId)
          ? prev.filter((id) => id !== skillId)
          : [...prev, skillId],
      );
    };

    const handleSave = () => {
      mutate(
        {
          params: { path: { username } },
          body: { skills: localSelectedSkillIds },
        },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Success",
              description: "Skills updated successfully",
              type: "success",
            });
          },
          onError: () => {
            toastManager.add({
              title: "Error",
              description: "Failed to update skills",
              type: "error",
            });
          },
        },
      );
    };

    const hasChanges =
      JSON.stringify([...selectedSkillIds].sort()) !==
      JSON.stringify([...localSelectedSkillIds].sort());

    useImperativeHandle(ref, () => ({
      save: handleSave,
      isDirty: hasChanges,
      isPending,
    }));

    useEffect(() => {
      onStateChange({ isDirty: hasChanges, isPending });
    }, [hasChanges, isPending, onStateChange]);

    return (
      <div className="h-full overflow-auto">
        <Suspense fallback={<SkillsTabFallback />}>
          <SkillsList
            selectedSkillIds={localSelectedSkillIds}
            onToggle={handleToggle}
          />
        </Suspense>
      </div>
    );
  },
);
