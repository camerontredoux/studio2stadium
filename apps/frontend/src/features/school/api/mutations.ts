import { $api, type ApiSchemas } from "@/lib/api/client";
import { queries } from "@/shared/api/queries";
import { useQueryClient } from "@tanstack/react-query";
import { schoolQueries } from "./queries";

type Metadata = ApiSchemas["SchoolsIdMetadataResponse"];

export function useFollowSchool(id: string) {
  const queryClient = useQueryClient();

  const followingQueryKey = queries.following().queryKey;
  const metadataQueryKey = schoolQueries.metadata(id).queryKey;

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

      const previousMetadata = queryClient.getQueryData<Metadata>(
        metadataQueryKey,
      );
      const previousFollowing = queryClient.getQueryData<string[]>(
        followingQueryKey,
      );

      queryClient.setQueryData<Metadata>(
        metadataQueryKey,
        (old) => {
          if (!old) return;
          return {
            ...old,
            followers: old.followers + 1,
            following: true,
          };
        },
      );
      queryClient.setQueryData<string[]>(
        followingQueryKey,
        (old) => {
          if (!old) return;
          return [...old, id];
        },
      );

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

  const followingQueryKey = queries.following().queryKey;
  const metadataQueryKey = schoolQueries.metadata(id).queryKey;

  return $api.useMutation("delete", "/schools/{id}/follow", {
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

      const previousMetadata = queryClient.getQueryData<Metadata>(
        metadataQueryKey,
      );
      const previousFollowing = queryClient.getQueryData<string[]>(
        followingQueryKey,
      );

      queryClient.setQueryData<Metadata>(
        metadataQueryKey,
        (old) => {
          if (!old) return;
          return {
            ...old,
            followers: old.followers - 1,
            following: false,
          };
        },
      );

      queryClient.setQueryData<string[]>(
        followingQueryKey,
        (old) => {
          if (!old) return;
          return old.filter((followingId) => followingId !== id);
        },
      );

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
