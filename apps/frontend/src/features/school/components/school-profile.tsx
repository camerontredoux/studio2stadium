import { Button } from "@/components/ui/button";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useFollowSchool, useUnfollowSchool } from "../api/mutations";
import { schoolQueries } from "../api/queries";

interface SchoolProfileProps {
  username: string;
}

export function SchoolProfile({ username }: SchoolProfileProps) {
  const { data } = useSuspenseQuery(schoolQueries.profile(username));

  const { data: metadata } = useQuery(schoolQueries.metadata(data.id));

  const { mutate: followSchool } = useFollowSchool(data.id);
  const { mutate: unfollowSchool } = useUnfollowSchool(data.id);

  return (
    <div>
      <Button
        onClick={() => followSchool({ params: { path: { id: data.id } } })}
      >
        Follow
      </Button>
      <Button
        onClick={() => unfollowSchool({ params: { path: { id: data.id } } })}
        variant="outline"
      >
        Unfollow
      </Button>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(metadata, null, 2)}
      </pre>
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
