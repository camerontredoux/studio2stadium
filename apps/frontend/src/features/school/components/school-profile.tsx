import { useSuspenseQuery } from "@tanstack/react-query";
import { schoolQueries } from "../api/queries";

interface SchoolProfileProps {
  username: string;
}

export function SchoolProfile({ username }: SchoolProfileProps) {
  const { data } = useSuspenseQuery(schoolQueries.profile(username));

  return (
    <div>
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
