import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { queries } from "@/shared/api/queries";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Suspense } from "react";
import { dancerQueries } from "./api/queries";
import { DancerFollowingDialog } from "./components/following-dialog";
import { FavoriteSection } from "./components/profile/favorite-section";
import { SkillsList } from "./components/skills/skills-list";

export function DancerProfile() {
  const { username } = useParams({ from: "/_app/(routes)/$username" });

  const session = useSession();
  const { data } = useSuspenseQuery(dancerQueries.profile(username));

  const { data: activity } = useQuery(queries.activity());

  return (
    <div>
      {session.type === "school" && <FavoriteSection dancer={data} />}
      <DancerFollowingDialog>
        <Button>{activity?.following} Following</Button>
      </DancerFollowingDialog>
      <Suspense fallback={<div>Loading...</div>}>
        <SkillsList />
      </Suspense>
      <pre className="max-w-full wrap-break-word whitespace-pre-wrap">
        {JSON.stringify({ session, data }, null, 2)}
      </pre>
    </div>
  );
}
