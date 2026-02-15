import { Button } from "@/components/ui/button";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { HeartCrackIcon, HeartIcon } from "lucide-react";
import { useFollowSchool, useUnfollowSchool } from "../api/mutations";
import { schoolQueries } from "../api/queries";

interface SchoolProfileProps {
  username: string;
}

export function SchoolProfile({ username }: SchoolProfileProps) {
  const { data } = useSuspenseQuery(schoolQueries.profile(username));

  const { data: metadata, isPending } = useQuery(
    schoolQueries.metadata(data.id),
  );

  const { mutate: followSchool } = useFollowSchool(data.id);
  const { mutate: unfollowSchool } = useUnfollowSchool(data.id);

  return (
    <div>
      <div className="h-6">
        {/* fixed height reserves space */}
        <span
          className={`transition-opacity duration-300 ${
            isPending ? "opacity-0" : "opacity-100"
          }`}
        >
          {metadata?.followers} followers
        </span>
      </div>
      {metadata?.following ? (
        <Button
          onClick={() => unfollowSchool({ params: { path: { id: data.id } } })}
          variant="destructive-outline"
        >
          <HeartCrackIcon /> Unfollow
        </Button>
      ) : (
        <Button
          onClick={() => followSchool({ params: { path: { id: data.id } } })}
          variant="outline"
        >
          <HeartIcon /> Follow
        </Button>
      )}
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(metadata, null, 2)}
      </pre>
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
