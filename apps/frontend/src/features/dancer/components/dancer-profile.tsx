import { useSession } from "@/lib/session";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dancerQueries } from "../api/queries";
import { FavoriteSection } from "./profile/favorite-section";

export function DancerProfile({ username }: { username: string }) {
  const session = useSession();
  const { data } = useSuspenseQuery(dancerQueries.profile(username));

  return (
    <div>
      {session.type === "school" && <FavoriteSection id={data.id} />}
      <pre className="max-w-full wrap-break-word whitespace-pre-wrap">
        {JSON.stringify({ session, data }, null, 2)}
      </pre>
    </div>
  );
}
