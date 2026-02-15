import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { schoolQueries } from "../api/queries";
import { FollowSection } from "./profile/follow-section";

interface SchoolProfileProps {
  username: string;
}

export function SchoolProfile({ username }: SchoolProfileProps) {
  const { data } = useSuspenseQuery(schoolQueries.profile(username));

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <FollowSection id={data.id} />
      </Suspense>
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
