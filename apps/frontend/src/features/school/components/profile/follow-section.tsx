import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { useSession } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { HeartIcon } from "lucide-react";
import { useShowInterest } from "../../api/mutations";
import { schoolQueries } from "../../api/queries";
import { type SchoolProfile } from "../../types";
import { FollowButton } from "./follow-button";

export function FollowSection({ school }: { school: SchoolProfile }) {
  const session = useSession();
  const { data } = useQuery(schoolQueries.metadata(school.id));

  const isFollowing = data?.following ?? false;

  const { mutate } = useShowInterest(school.id);

  return (
    <div>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(
          data ? data : { followers: 0, following: false, interested: false },
          null,
          2,
        )}
      </pre>

      {isFollowing && session.subscribed && (
        <Button
          onClick={() =>
            mutate(
              { params: { path: { id: school.id } } },
              {
                onError: handleApiError({
                  onError: (error) => {
                    toastManager.add({
                      title: "Error",
                      description: error.message,
                      type: "error",
                    });
                  },
                }),
              },
            )
          }
          variant="outline"
        >
          <HeartIcon /> Show Interest
        </Button>
      )}
      <FollowButton school={school} isFollowing={isFollowing} />
    </div>
  );
}
