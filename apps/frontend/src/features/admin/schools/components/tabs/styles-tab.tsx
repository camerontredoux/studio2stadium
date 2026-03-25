import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useAdminUpdateSchoolStyles } from "@/features/admin/api/mutations";
import { StylesList } from "@/shared/styles/components/styles-list";
import { forwardRef, Suspense, useEffect, useImperativeHandle, useState } from "react";
import type { TabHandle } from "./types";

interface StylesTabProps {
  username: string;
  selectedStyleIds: string[];
  onStateChange: (state: { isDirty: boolean; isPending: boolean }) => void;
}

function StylesTabFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner label="Loading styles..." />
    </div>
  );
}

export const StylesTab = forwardRef<TabHandle, StylesTabProps>(
  function StylesTab({ username, selectedStyleIds, onStateChange }, ref) {
    const [localSelectedStyleIds, setLocalSelectedStyleIds] =
      useState<string[]>(selectedStyleIds);
    const { mutate, isPending } = useAdminUpdateSchoolStyles();

  const handleToggle = (styleId: string) => {
    setLocalSelectedStyleIds((prev) =>
      prev.includes(styleId)
        ? prev.filter((id) => id !== styleId)
        : [...prev, styleId],
    );
  };

  const handleSave = () => {
    mutate(
      {
        params: { path: { username } },
        body: { styles: localSelectedStyleIds },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Styles updated successfully",
            type: "success",
          });
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to update styles",
            type: "error",
          });
        },
      },
    );
  };

  const hasChanges =
    JSON.stringify([...selectedStyleIds].sort()) !==
    JSON.stringify([...localSelectedStyleIds].sort());

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
      <Suspense fallback={<StylesTabFallback />}>
        <div className="flex-1 overflow-auto">
          <StylesList
            selectedStyleIds={localSelectedStyleIds}
            onToggle={handleToggle}
          />
        </div>
      </Suspense>
    </div>
  );
});
