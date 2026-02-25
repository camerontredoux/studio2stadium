import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { SkillsDialog } from "@/shared/skills/components/skills-dialog";
import type { ButtonProps } from "@base-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useUpdateSkills } from "../../api/mutations";
import { dancerQueries } from "../../api/queries";

interface SkillsListProps extends ButtonProps {
  username?: string;
}

export function SkillsList({ username, ...props }: SkillsListProps) {
  const { data } = useSuspenseQuery(dancerQueries.skills());
  const { mutateAsync, isPending } = useUpdateSkills(username);

  const selectedSkillIds = data.map((skill) => skill.skillId);

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
        onError: handleApiError({
          onError: (error) => {
            toastManager.add({
              title: "Error",
              description: error.message,
              type: "error",
            });
          },
          onValidation: (_, message) => {
            toastManager.add({
              title: "Error",
              description: message,
              type: "error",
            });
          },
        }),
      },
    );
  };

  return (
    <SkillsDialog
      selectedSkillIds={selectedSkillIds}
      onSave={handleSave}
      isPending={isPending}
      {...props}
    />
  );
}
