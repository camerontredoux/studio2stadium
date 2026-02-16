import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { schoolQueries } from "@/features/school/api/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

export function SchoolFollowers() {
  const { data } = useSuspenseQuery(schoolQueries.followers());

  return data.map((follower) => (
    <div key={follower.username} className="flex items-center gap-2">
      <Avatar>
        <AvatarImage src={follower.avatar ?? undefined} />
        <AvatarFallback>
          {follower.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <Link to="/$username" params={{ username: follower?.username }}>
        {follower?.name}
      </Link>
    </div>
  ));
}
