import { $api, type ApiSchemas } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { queries } from "./queries";

type Metadata = ApiSchemas["SchoolsIdMetadataResponse"];

const schoolMetadataKey = (id: string) =>
  $api.queryOptions("get", "/schools/{id}/metadata", {
    params: { path: { id } },
  }).queryKey;

const dancerFollowingKey = $api.queryOptions(
  "get",
  "/dancers/me/following",
).queryKey;

export function useFollowSchool(id: string) {
  const queryClient = useQueryClient();

  const followingQueryKey = queries.followingIds().queryKey;
  const metadataQueryKey = schoolMetadataKey(id);

  return $api.useMutation("post", "/schools/{id}/follow", {
    meta: {
      invalidateQueries: [metadataQueryKey],
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: metadataQueryKey,
      });
      await queryClient.cancelQueries({
        queryKey: followingQueryKey,
      });

      const previousMetadata =
        queryClient.getQueryData<Metadata>(metadataQueryKey);
      const previousFollowing =
        queryClient.getQueryData<string[]>(followingQueryKey);

      queryClient.setQueryData<Metadata>(metadataQueryKey, (old) => {
        if (!old) return;
        return {
          ...old,
          followers: old.followers + 1,
          following: true,
        };
      });
      queryClient.setQueryData<string[]>(followingQueryKey, (old) => {
        if (!old) return;
        return [...old, id];
      });

      return { previousMetadata, previousFollowing };
    },
    onError: (_err, _variables, context) => {
      const result = context as {
        previousMetadata: Metadata | undefined;
        previousFollowing: string[] | undefined;
      };
      if (result?.previousMetadata) {
        queryClient.setQueryData<Metadata>(
          metadataQueryKey,
          result.previousMetadata,
        );
      }
      if (result?.previousFollowing) {
        queryClient.setQueryData<string[]>(
          followingQueryKey,
          result.previousFollowing,
        );
      }
    },
  });
}

export function useUnfollowSchool(id: string) {
  const queryClient = useQueryClient();

  const followingIdsQueryKey = queries.followingIds().queryKey;
  const metadataQueryKey = schoolMetadataKey(id);
  const followingQueryKey = dancerFollowingKey;

  return $api.useMutation("delete", "/schools/{id}/follow", {
    meta: {
      invalidateQueries: [metadataQueryKey, followingQueryKey],
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: metadataQueryKey,
      });
      await queryClient.cancelQueries({
        queryKey: followingIdsQueryKey,
      });

      const previousMetadata =
        queryClient.getQueryData<Metadata>(metadataQueryKey);
      const previousFollowing =
        queryClient.getQueryData<string[]>(followingIdsQueryKey);

      queryClient.setQueryData<Metadata>(metadataQueryKey, (old) => {
        if (!old) return;
        return {
          ...old,
          followers: old.followers - 1,
          following: false,
        };
      });

      queryClient.setQueryData<string[]>(followingIdsQueryKey, (old) => {
        if (!old) return;
        return old.filter((followingId) => followingId !== id);
      });

      return { previousMetadata, previousFollowing };
    },
    onError: (_err, _variables, context) => {
      const result = context as {
        previousMetadata: Metadata | undefined;
        previousFollowing: string[] | undefined;
      };
      if (result?.previousMetadata) {
        queryClient.setQueryData<Metadata>(
          metadataQueryKey,
          result.previousMetadata,
        );
      }
      if (result?.previousFollowing) {
        queryClient.setQueryData<string[]>(
          followingIdsQueryKey,
          result.previousFollowing,
        );
      }
    },
  });
}
