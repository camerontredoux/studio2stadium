import { SkillsDialog } from "@/shared/skills/components/skills-dialog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { dancerQueries } from "../../api/queries";

export function SkillsList() {
  const { data } = useSuspenseQuery(dancerQueries.skills());

  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    data.map((skill) => skill.skillId),
  );

  return (
    <SkillsDialog
      selectedSkillIds={selectedSkillIds}
      onToggle={(skillId) => {
        setSelectedSkillIds((prev) =>
          prev.includes(skillId)
            ? prev.filter((id) => id !== skillId)
            : [...prev, skillId],
        );
      }}
    />
  );
}
