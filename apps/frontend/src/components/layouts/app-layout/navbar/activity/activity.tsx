import { DancerFollowersDialog } from "@/features/dancer/components/followers-dialog";
import { DancerFollowingDialog } from "@/features/dancer/components/following-dialog";
import { SchoolFollowersDialog } from "@/features/school/components/followers-dialog";
import { SchoolFollowingDialog } from "@/features/school/components/following-dialog";
import { useSession } from "@/lib/session";
import { queries } from "@/shared/api/queries";
import { useQuery } from "@tanstack/react-query";

export function Activity() {
  const session = useSession();
  const { data } = useQuery(queries.activity());

  const followers = data?.followers ?? 0;
  const following = data?.following ?? 0;

  return (
    <div className="hidden p-2 text-sm xl:block">
      <p className="mb-2 font-medium">Your Activity</p>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">Videos</p>
          <p className="ml-auto">{data?.videos ?? 0}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">Images</p>
          <p className="ml-auto">{data?.images ?? 0}</p>
        </div>
        {session.type === "dancer" ? (
          <>
            <DancerFollowersDialog count={followers} />
            <DancerFollowingDialog count={following} />
          </>
        ) : (
          <>
            <SchoolFollowersDialog count={followers} />
            <SchoolFollowingDialog count={following} />
          </>
        )}
      </div>
    </div>
  );
}
