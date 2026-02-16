import { queries } from "@/shared/api/queries";
import { useQuery } from "@tanstack/react-query";
import { Followers } from "./followers/followers";
import { Following } from "./following/following";

export function Activity() {
  const { data } = useQuery(queries.activity());

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
        <Followers followers={data?.followers ?? 0} />
        <Following following={data?.following ?? 0} />
      </div>
    </div>
  );
}
