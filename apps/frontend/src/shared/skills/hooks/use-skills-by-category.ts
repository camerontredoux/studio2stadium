import { useSuspenseQuery } from "@tanstack/react-query";
import { skillQueries } from "../api/queries";
import type { Skill } from "../types";

export function useSkillsByCategory() {
  const { data } = useSuspenseQuery(skillQueries.all());

  return data.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>,
  );
}
