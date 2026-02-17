import { $api, type ApiSchemas } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { queries } from "./queries";

type SchoolMetadata = ApiSchemas["SchoolsIdMetadataResponse"];
type Activity = ApiSchemas["UsersActivityResponse"];

const schoolMetadataKey = (id: string) =>
  $api.queryOptions("get", "/schools/{id}/metadata", {
    params: { path: { id } },
  }).queryKey;

export function useFollowSchool(id: string) {
  const queryClient = useQueryClient();

  const followingIdsQueryKey = queries.followingIds().queryKey;
  const activityQueryKey = queries.activity().queryKey;
  const metadataQueryKey = schoolMetadataKey(id);

  return $api.useMutation("post", "/schools/{id}/follow", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: metadataQueryKey });
      await queryClient.cancelQueries({ queryKey: followingIdsQueryKey });
      await queryClient.cancelQueries({ queryKey: activityQueryKey });

      const previousMetadata =
        queryClient.getQueryData<SchoolMetadata>(metadataQueryKey);
      const previousFollowingIds =
        queryClient.getQueryData<string[]>(followingIdsQueryKey);
      const previousActivity =
        queryClient.getQueryData<Activity>(activityQueryKey);

      queryClient.setQueryData<SchoolMetadata>(metadataQueryKey, (old) => {
        if (!old) return;
        return {
          ...old,
          followers: old.followers + 1,
          following: true,
        };
      });
      queryClient.setQueryData<string[]>(followingIdsQueryKey, (old) => {
        if (!old) return;
        return [...old, id];
      });
      queryClient.setQueryData<Activity>(activityQueryKey, (old) => {
        if (!old) return;
        return { ...old, following: old.following + 1 };
      });

      return { previousMetadata, previousFollowingIds, previousActivity };
    },
    onError: (_err, _variables, context) => {
      const result = context as {
        previousMetadata: SchoolMetadata | undefined;
        previousFollowingIds: string[] | undefined;
        previousActivity: Activity | undefined;
      };
      if (result?.previousMetadata) {
        queryClient.setQueryData<SchoolMetadata>(
          metadataQueryKey,
          result.previousMetadata,
        );
      }
      if (result?.previousFollowingIds) {
        queryClient.setQueryData<string[]>(
          followingIdsQueryKey,
          result.previousFollowingIds,
        );
      }
      if (result?.previousActivity) {
        queryClient.setQueryData<Activity>(
          activityQueryKey,
          result.previousActivity,
        );
      }
    },
  });
}

export function useUnfollowSchool(id: string) {
  const queryClient = useQueryClient();

  const followingIdsQueryKey = queries.followingIds().queryKey;
  const activityQueryKey = queries.activity().queryKey;
  const metadataQueryKey = schoolMetadataKey(id);

  return $api.useMutation("delete", "/schools/{id}/follow", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: metadataQueryKey });
      await queryClient.cancelQueries({ queryKey: followingIdsQueryKey });
      await queryClient.cancelQueries({ queryKey: activityQueryKey });

      const previousMetadata =
        queryClient.getQueryData<SchoolMetadata>(metadataQueryKey);
      const previousFollowingIds =
        queryClient.getQueryData<string[]>(followingIdsQueryKey);
      const previousActivity =
        queryClient.getQueryData<Activity>(activityQueryKey);

      queryClient.setQueryData<SchoolMetadata>(metadataQueryKey, (old) => {
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
      queryClient.setQueryData<Activity>(activityQueryKey, (old) => {
        if (!old) return;
        return { ...old, following: old.following - 1 };
      });

      return { previousMetadata, previousFollowingIds, previousActivity };
    },
    onError: (_err, _variables, context) => {
      const result = context as {
        previousMetadata: SchoolMetadata | undefined;
        previousFollowingIds: string[] | undefined;
        previousActivity: Activity | undefined;
      };
      if (result?.previousMetadata) {
        queryClient.setQueryData<SchoolMetadata>(
          metadataQueryKey,
          result.previousMetadata,
        );
      }
      if (result?.previousFollowingIds) {
        queryClient.setQueryData<string[]>(
          followingIdsQueryKey,
          result.previousFollowingIds,
        );
      }
      if (result?.previousActivity) {
        queryClient.setQueryData<Activity>(
          activityQueryKey,
          result.previousActivity,
        );
      }
    },
  });
}

type DancerMetadata = ApiSchemas["DancersIdMetadataResponse"];

export function useFavoriteDancer(id: string) {
  const queryClient = useQueryClient();

  const metadataQueryKey = $api.queryOptions("get", "/dancers/{id}/metadata", {
    params: { path: { id } },
  }).queryKey;
  const activityQueryKey = queries.activity().queryKey;

  return $api.useMutation("post", "/dancers/{id}/favorite", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: metadataQueryKey });
      await queryClient.cancelQueries({ queryKey: activityQueryKey });

      const previousMetadata =
        queryClient.getQueryData<DancerMetadata>(metadataQueryKey);
      const previousActivity =
        queryClient.getQueryData<Activity>(activityQueryKey);

      queryClient.setQueryData<DancerMetadata>(metadataQueryKey, (old) => {
        if (!old) return;
        return {
          ...old,
          followers: old.followers + 1,
          favorited: true,
        };
      });
      queryClient.setQueryData<Activity>(activityQueryKey, (old) => {
        if (!old) return;
        return { ...old, following: old.following + 1 };
      });

      return { previousMetadata, previousActivity };
    },
    onError: (_err, _variables, context) => {
      const result = context as {
        previousMetadata: DancerMetadata | undefined;
        previousActivity: Activity | undefined;
      };
      if (result?.previousMetadata) {
        queryClient.setQueryData<DancerMetadata>(
          metadataQueryKey,
          result.previousMetadata,
        );
      }
      if (result?.previousActivity) {
        queryClient.setQueryData<Activity>(
          activityQueryKey,
          result.previousActivity,
        );
      }
    },
  });
}

export function useUnfavoriteDancer(id: string) {
  const queryClient = useQueryClient();

  const metadataQueryKey = $api.queryOptions("get", "/dancers/{id}/metadata", {
    params: { path: { id } },
  }).queryKey;
  const activityQueryKey = queries.activity().queryKey;

  return $api.useMutation("delete", "/dancers/{id}/favorite", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: metadataQueryKey });
      await queryClient.cancelQueries({ queryKey: activityQueryKey });

      const previousMetadata =
        queryClient.getQueryData<DancerMetadata>(metadataQueryKey);
      const previousActivity =
        queryClient.getQueryData<Activity>(activityQueryKey);

      queryClient.setQueryData<DancerMetadata>(metadataQueryKey, (old) => {
        if (!old) return;
        return {
          ...old,
          followers: old.followers - 1,
          favorited: false,
        };
      });
      queryClient.setQueryData<Activity>(activityQueryKey, (old) => {
        if (!old) return;
        return { ...old, following: old.following - 1 };
      });

      return { previousMetadata, previousActivity };
    },
    onError: (_err, _variables, context) => {
      const result = context as {
        previousMetadata: DancerMetadata | undefined;
        previousActivity: Activity | undefined;
      };
      if (result?.previousMetadata) {
        queryClient.setQueryData<DancerMetadata>(
          metadataQueryKey,
          result.previousMetadata,
        );
      }
      if (result?.previousActivity) {
        queryClient.setQueryData<Activity>(
          activityQueryKey,
          result.previousActivity,
        );
      }
    },
  });
}
