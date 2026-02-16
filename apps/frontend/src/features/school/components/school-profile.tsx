import { useSession } from "@/lib/session";
import { useSuspenseQuery } from "@tanstack/react-query";
import { schoolQueries } from "../api/queries";
import { FollowSection } from "./profile/follow-section";

interface SchoolProfileProps {
  username: string;
}

export function SchoolProfile({ username }: SchoolProfileProps) {
  const session = useSession();

  const { data } = useSuspenseQuery(schoolQueries.profile(username));

  return (
    <div>
      {session.type === "dancer" && <FollowSection id={data.id} />}
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
