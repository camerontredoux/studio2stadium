import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useAdminUpdateSchoolSkills } from "@/features/admin/api/mutations";
import { SkillsList } from "@/shared/skills/components/skills-list";
import { SkillsWeightedList } from "@/shared/skills/components/skills-weighted-list";
import { forwardRef, Suspense, useCallback, useEffect, useImperativeHandle, useState } from "react";
import type { TabHandle } from "./types";

interface SkillsTabProps {
  username: string;
  selectedSkillIds: string[];
  selectedWeights?: Map<string, number>;
  onStateChange: (state: { isDirty: boolean; isPending: boolean }) => void;
}

function SkillsTabFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner label="Loading skills..." />
    </div>
  );
}

function serializeWeights(weights: Map<string, number>): string {
  return JSON.stringify(
    [...weights].sort(([a], [b]) => a.localeCompare(b)),
  );
}

export const SkillsTab = forwardRef<TabHandle, SkillsTabProps>(
  function SkillsTab({ username, selectedSkillIds, selectedWeights, onStateChange }, ref) {
    const initialWeights: Map<string, number> = selectedWeights
      ? new Map(selectedWeights)
      : new Map(selectedSkillIds.map((id) => [id, 1]));

    const [localWeights, setLocalWeights] = useState<Map<string, number>>(initialWeights);
    const { mutate, isPending } = useAdminUpdateSchoolSkills(username);

  const selectedSkillIdList = [...localWeights.keys()];

  const handleToggle = useCallback((skillId: string) => {
    setLocalWeights((prev) => {
      const next = new Map(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.set(skillId, 1);
      }
      return next;
    });
  }, []);

  const handleWeightChange = useCallback((skillId: string, weight: number | null) => {
    setLocalWeights((prev) => {
      const next = new Map(prev);
      if (weight === null) {
        next.delete(skillId);
      } else {
        next.set(skillId, weight);
      }
      return next;
    });
  }, []);

  const handleSave = () => {
    const skills = [...localWeights].map(([skillId, weight]) => ({ skillId, weight }));
    mutate(
      {
        params: { path: { username } },
        body: { skills },
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

  const hasChanges = serializeWeights(initialWeights) !== serializeWeights(localWeights);

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
          selectedSkillIds={selectedSkillIdList}
          onToggle={handleToggle}
          summarySlot={
            <SkillsWeightedList
              className="hidden md:flex"
              selectedSkills={localWeights}
              onWeightChange={handleWeightChange}
            />
          }
        />
      </Suspense>
    </div>
  );
});
