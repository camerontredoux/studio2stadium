import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { queries } from "@/shared/api/queries";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { dancerQueries } from "../api/queries";
import { DancerFollowingDialog } from "./following-dialog";
import { FavoriteSection } from "./profile/favorite-section";

export function DancerProfile({ username }: { username: string }) {
  const session = useSession();
  const { data } = useSuspenseQuery(dancerQueries.profile(username));

  const { data: activity } = useQuery(queries.activity());

  return (
    <div>
      {session.type === "school" && <FavoriteSection dancer={data} />}
      <DancerFollowingDialog>
        <Button>{activity?.following} Following</Button>
      </DancerFollowingDialog>
      <pre className="max-w-full wrap-break-word whitespace-pre-wrap">
        {JSON.stringify({ session, data }, null, 2)}
      </pre>
    </div>
  );
}
