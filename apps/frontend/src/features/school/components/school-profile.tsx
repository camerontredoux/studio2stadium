import { useSession } from "@/lib/session";
import { useSuspenseQuery } from "@tanstack/react-query";
import { schoolQueries } from "../api/queries";

interface SchoolProfileProps {
  username: string;
}

export function SchoolProfile({ username }: SchoolProfileProps) {
  const session = useSession();

  const { data } = useSuspenseQuery(schoolQueries.detail(username));

  return (
    <div>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify({ ...session, ...data }, null, 2)}
      </pre>
    </div>
  );
}
