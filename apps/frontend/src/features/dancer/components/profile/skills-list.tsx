import { toastManager } from "@/components/ui/toast-manager";
import { toastApiError } from "@/lib/api/errors";
import { retryLoad } from "@/lib/retry-load";
import { SkillsDialog } from "@/shared/skills/components/skills-dialog";
import type { ButtonProps } from "@base-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useUpdateSkills } from "../../api/mutations";
import { dancerQueries } from "../../api/queries";

interface SkillsListProps extends ButtonProps {
  username?: string;
}

export function SkillsList({ username, ...props }: SkillsListProps) {
  const { data, isError, refetch } = useQuery(dancerQueries.skills());
  const { mutateAsync, isPending } = useUpdateSkills(username);

  const selectedSkillIds = (data ?? []).map((skill) => skill.skillId);

  const handleSave = async (skillIds: string[]) => {
    await mutateAsync(
      { body: { skills: skillIds } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Your skills have been updated",
            type: "success",
          });
        },
        onError: toastApiError,
      },
    );
  };

  return (
    <SkillsDialog
      selectedSkillIds={selectedSkillIds}
      onSave={handleSave}
      isPending={isPending}
      {...props}
      // Until the saved selection loads, the dialog would open with nothing
      // selected and Save would overwrite it, so don't offer it yet. If the
      // load failed, the trigger retries it instead of opening the dialog.
      disabled={(!data && !isError) || props.disabled}
      onClick={
        !data && isError
          ? (event) => {
              event.preventBaseUIHandler();
              void retryLoad(refetch, "Error loading your skills");
            }
          : props.onClick
      }
    />
  );
}
