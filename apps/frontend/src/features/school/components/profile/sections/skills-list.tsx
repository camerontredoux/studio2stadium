import { toastManager } from "@/components/ui/toast-manager";
import { useUpdateSkills } from "@/features/school/api/mutations";
import { schoolQueries } from "@/features/school/api/queries";
import { handleApiError } from "@/lib/api/errors";
import { SkillsDialog } from "@/shared/skills/components/skills-dialog";
import type { ButtonProps } from "@base-ui/react";
import { useQuery } from "@tanstack/react-query";

interface SkillsListProps extends ButtonProps {
  username?: string;
}

export function SkillsList({ username, ...props }: SkillsListProps) {
  const { data } = useQuery(schoolQueries.skills());
  const { mutateAsync, isPending } = useUpdateSkills(username);

  const selectedSkillIds = (data ?? []).map((skill) => skill.skillId);
  const selectedWeights = new Map(
    (data ?? []).map((skill) => [skill.skillId, (skill as any).weight ?? 1]),
  );

  const handleSave = async (skillIds: string[], weights?: Map<string, number>) => {
    const skillsPayload = weights
      ? [...weights].map(([skillId, weight]) => ({ skillId, weight }))
      : skillIds.map((skillId) => ({ skillId, weight: 1 }));
    await mutateAsync(
      { body: { skills: skillsPayload } },
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
      selectedWeights={selectedWeights}
      onSave={handleSave}
      isPending={isPending}
      {...props}
    />
  );
}
