import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { useSession } from "@/lib/session";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HeartIcon } from "lucide-react";
import { useShowInterest } from "../../api/mutations";
import { schoolQueries } from "../../api/queries";
import { FollowButton } from "./follow-button";

export function FollowSection({ id }: { id: string }) {
  const session = useSession();
  const { data } = useSuspenseQuery(schoolQueries.metadata(id));

  const isFollowing = data.following;

  const { mutate } = useShowInterest(id);

  return (
    <div>
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>

      {isFollowing && session.subscribed && (
        <Button
          onClick={() =>
            mutate(
              { params: { path: { id } } },
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
      <FollowButton id={id} isFollowing={isFollowing} />
    </div>
  );
}
