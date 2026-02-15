import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { HeartCrackIcon, HeartIcon } from "lucide-react";
import {
  useFollowSchool,
  useShowInterest,
  useUnfollowSchool,
} from "../api/mutations";
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
  const { mutate: showInterest } = useShowInterest(data.id);

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
      <Button
        onClick={() =>
          showInterest(
            { params: { path: { id: data.id } } },
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
      {metadata?.following ? (
        <Button
          onClick={() =>
            unfollowSchool(
              { params: { path: { id: data.id } } },
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
          variant="destructive-outline"
        >
          <HeartCrackIcon /> Unfollow
        </Button>
      ) : (
        <Button
          onClick={() =>
            followSchool(
              { params: { path: { id: data.id } } },
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
