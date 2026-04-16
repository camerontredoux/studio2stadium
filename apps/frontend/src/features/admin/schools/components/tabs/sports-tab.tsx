import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useAdminUpdateSchoolSports } from "@/features/admin/api/mutations";
import { SportsList } from "@/shared/sports/components/sports-list";
import {
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { TabHandle } from "./types";

interface SportsTabProps {
  username: string;
  selectedSportIds: string[];
  onStateChange: (state: { isDirty: boolean; isPending: boolean }) => void;
}

function SportsTabFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner label="Loading sports..." />
    </div>
  );
}

export const SportsTab = forwardRef<TabHandle, SportsTabProps>(
  function SportsTab({ username, selectedSportIds, onStateChange }, ref) {
    const [localSelectedSportIds, setLocalSelectedSportIds] =
      useState<string[]>(selectedSportIds);
    const { mutate, isPending } = useAdminUpdateSchoolSports();

    const handleToggle = (sportId: string) => {
      setLocalSelectedSportIds((prev) =>
        prev.includes(sportId)
          ? prev.filter((id) => id !== sportId)
          : [...prev, sportId],
      );
    };

    const handleSave = () => {
      mutate(
        {
          params: { path: { username } },
          body: { sports: localSelectedSportIds },
        },
        {
          onSuccess: () => {
            toastManager.add({
              title: "Success",
              description: "Sports updated successfully",
              type: "success",
            });
          },
          onError: () => {
            toastManager.add({
              title: "Error",
              description: "Failed to update sports",
              type: "error",
            });
          },
        },
      );
    };

    const hasChanges =
      JSON.stringify([...selectedSportIds].sort()) !==
      JSON.stringify([...localSelectedSportIds].sort());

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
        <Suspense fallback={<SportsTabFallback />}>
          <div className="flex-1 overflow-auto">
            <SportsList
              selectedSportIds={localSelectedSportIds}
              onToggle={handleToggle}
            />
          </div>
        </Suspense>
      </div>
    );
  },
);
