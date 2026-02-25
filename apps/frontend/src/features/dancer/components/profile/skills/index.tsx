import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { SkillsList } from "@/features/dancer/components/profile/skills-list";
import { type ApiSchemas } from "@/lib/api/client";
import { PlusIcon } from "lucide-react";
import { useProfile } from "../context/use-profile";

type ProfileSkill =
  ApiSchemas["DancersIdResponse"]["skills"][number];

function groupByCategory(skills: ProfileSkill[]) {
  const hasCategory = skills.some((s) => s.category?.trim());
  if (!hasCategory) {
    return [{ category: null, skills }] as const;
  }
  const map = new Map<string, ProfileSkill[]>();
  for (const skill of skills) {
    const key = skill.category?.trim() ?? "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(skill);
  }
  return Array.from(map.entries()).map(([category, list]) => ({
    category: category || null,
    skills: list,
  }));
}

export function Skills({
  skills,
  username,
}: {
  skills: ProfileSkill[];
  username: string;
}) {
  const { showOwnerControls } = useProfile();
  const groups = groupByCategory(skills);

  return (
    <Frame className="h-fit w-full">
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Skills
          {showOwnerControls ? (
            <SkillsList username={username} render={<Button size="icon-xs" variant="ghost" />}>
              <PlusIcon />
            </SkillsList>
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="p-4">
        {skills.length > 0 ? (
          <div className="flex flex-col gap-4">
            {groups.map(({ category, skills: groupSkills }) => (
              <div key={category ?? "_"} className="flex flex-col gap-2">
                {category ? (
                  <span className="text-muted-foreground text-sm font-medium">
                    {category}
                  </span>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {groupSkills.map((skill) => (
                    <Badge
                      key={skill.slug}
                      variant="brand"
                      className="rounded-full"
                    >
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">
            No skills selected
          </span>
        )}
      </FramePanel>
    </Frame>
  );
}
