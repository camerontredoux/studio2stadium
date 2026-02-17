import { $api, type ApiSchemas } from "@/lib/api/client";
import { type FavoritedDancer, type FollowedSchool } from "@/shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { queries } from "./queries";

type SchoolMetadata = ApiSchemas["SchoolsIdMetadataResponse"];
type Activity = ApiSchemas["UsersActivityResponse"];
type DancerFollowing = ApiSchemas["DancersMeFollowingResponse"];

const schoolMetadataKey = (id: string) =>
  $api.queryOptions("get", "/schools/{id}/metadata", {
    params: { path: { id } },
  }).queryKey;

const dancerFollowingKey = $api.queryOptions(
  "get",
  "/dancers/me/following",
).queryKey;

export function useFollowSchool(school: FollowedSchool) {
  const queryClient = useQueryClient();

  const followingIdsQueryKey = queries.followingIds().queryKey;
  const followingQueryKey = dancerFollowingKey;
  const activityQueryKey = queries.activity().queryKey;
  const metadataQueryKey = schoolMetadataKey(school.id);

  return $api.useMutation("post", "/schools/{id}/follow", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: metadataQueryKey });
      await queryClient.cancelQueries({ queryKey: followingIdsQueryKey });
      await queryClient.cancelQueries({ queryKey: followingQueryKey });
      await queryClient.cancelQueries({ queryKey: activityQueryKey });

      const previousMetadata =
        queryClient.getQueryData<SchoolMetadata>(metadataQueryKey);
      const previousFollowingIds =
        queryClient.getQueryData<string[]>(followingIdsQueryKey);
      const previousFollowing =
        queryClient.getQueryData<DancerFollowing>(followingQueryKey);
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
        return [...old, school.id];
      });
      queryClient.setQueryData<DancerFollowing>(followingQueryKey, (old) => {
        if (!old) return;
        return [...old, school];
      });
      queryClient.setQueryData<Activity>(activityQueryKey, (old) => {
        if (!old) return;
        return { ...old, following: old.following + 1 };
      });

      return {
        previousMetadata,
        previousFollowingIds,
        previousFollowing,
        previousActivity,
      };
    },
    onError: (_err, _variables, context) => {
      const result = context as {
        previousMetadata: SchoolMetadata | undefined;
        previousFollowingIds: string[] | undefined;
        previousFollowing: DancerFollowing | undefined;
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
      if (result?.previousFollowing) {
        queryClient.setQueryData<DancerFollowing>(
          followingQueryKey,
          result.previousFollowing,
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

export function useUnfollowSchool(school: FollowedSchool) {
  const queryClient = useQueryClient();

  const followingIdsQueryKey = queries.followingIds().queryKey;
  const followingQueryKey = dancerFollowingKey;
  const activityQueryKey = queries.activity().queryKey;
  const metadataQueryKey = schoolMetadataKey(school.id);

  return $api.useMutation("delete", "/schools/{id}/follow", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: metadataQueryKey });
      await queryClient.cancelQueries({ queryKey: followingIdsQueryKey });
      await queryClient.cancelQueries({ queryKey: followingQueryKey });
      await queryClient.cancelQueries({ queryKey: activityQueryKey });

      const previousMetadata =
        queryClient.getQueryData<SchoolMetadata>(metadataQueryKey);
      const previousFollowingIds =
        queryClient.getQueryData<string[]>(followingIdsQueryKey);
      const previousFollowing =
        queryClient.getQueryData<DancerFollowing>(followingQueryKey);
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
        return old.filter((followingId) => followingId !== school.id);
      });
      queryClient.setQueryData<DancerFollowing>(followingQueryKey, (old) => {
        if (!old) return;
        return old.filter((item) => item.id !== school.id);
      });
      queryClient.setQueryData<Activity>(activityQueryKey, (old) => {
        if (!old) return;
        return { ...old, following: old.following - 1 };
      });

      return {
        previousMetadata,
        previousFollowingIds,
        previousFollowing,
        previousActivity,
      };
    },
    onError: (_err, _variables, context) => {
      const result = context as {
        previousMetadata: SchoolMetadata | undefined;
        previousFollowingIds: string[] | undefined;
        previousFollowing: DancerFollowing | undefined;
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
      if (result?.previousFollowing) {
        queryClient.setQueryData<DancerFollowing>(
          followingQueryKey,
          result.previousFollowing,
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
type SchoolFollowing = ApiSchemas["SchoolsMeFollowingResponse"];

const schoolFollowingKey = $api.queryOptions(
  "get",
  "/schools/me/following",
).queryKey;

export function useFavoriteDancer(dancer: FavoritedDancer) {
  const queryClient = useQueryClient();

  const metadataQueryKey = $api.queryOptions("get", "/dancers/{id}/metadata", {
    params: { path: { id: dancer.id } },
  }).queryKey;
  const followingQueryKey = schoolFollowingKey;
  const activityQueryKey = queries.activity().queryKey;

  return $api.useMutation("post", "/dancers/{id}/favorite", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: metadataQueryKey });
      await queryClient.cancelQueries({ queryKey: followingQueryKey });
      await queryClient.cancelQueries({ queryKey: activityQueryKey });

      const previousMetadata =
        queryClient.getQueryData<DancerMetadata>(metadataQueryKey);
      const previousFollowing =
        queryClient.getQueryData<SchoolFollowing>(followingQueryKey);
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
      queryClient.setQueryData<SchoolFollowing>(followingQueryKey, (old) => {
        if (!old) return;
        return [...old, dancer];
      });
      queryClient.setQueryData<Activity>(activityQueryKey, (old) => {
        if (!old) return;
        return { ...old, following: old.following + 1 };
      });

      return { previousMetadata, previousFollowing, previousActivity };
    },
    onError: (_err, _variables, context) => {
      const result = context as {
        previousMetadata: DancerMetadata | undefined;
        previousFollowing: SchoolFollowing | undefined;
        previousActivity: Activity | undefined;
      };
      if (result?.previousMetadata) {
        queryClient.setQueryData<DancerMetadata>(
          metadataQueryKey,
          result.previousMetadata,
        );
      }
      if (result?.previousFollowing) {
        queryClient.setQueryData<SchoolFollowing>(
          followingQueryKey,
          result.previousFollowing,
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

export function useUnfavoriteDancer(dancer: FavoritedDancer) {
  const queryClient = useQueryClient();

  const metadataQueryKey = $api.queryOptions("get", "/dancers/{id}/metadata", {
    params: { path: { id: dancer.id } },
  }).queryKey;
  const followingQueryKey = schoolFollowingKey;
  const activityQueryKey = queries.activity().queryKey;

  return $api.useMutation("delete", "/dancers/{id}/favorite", {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: metadataQueryKey });
      await queryClient.cancelQueries({ queryKey: followingQueryKey });
      await queryClient.cancelQueries({ queryKey: activityQueryKey });

      const previousMetadata =
        queryClient.getQueryData<DancerMetadata>(metadataQueryKey);
      const previousFollowing =
        queryClient.getQueryData<SchoolFollowing>(followingQueryKey);
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
      queryClient.setQueryData<SchoolFollowing>(followingQueryKey, (old) => {
        if (!old) return;
        return old.filter((item) => item.id !== dancer.id);
      });
      queryClient.setQueryData<Activity>(activityQueryKey, (old) => {
        if (!old) return;
        return { ...old, following: old.following - 1 };
      });

      return { previousMetadata, previousFollowing, previousActivity };
    },
    onError: (_err, _variables, context) => {
      const result = context as {
        previousMetadata: DancerMetadata | undefined;
        previousFollowing: SchoolFollowing | undefined;
        previousActivity: Activity | undefined;
      };
      if (result?.previousMetadata) {
        queryClient.setQueryData<DancerMetadata>(
          metadataQueryKey,
          result.previousMetadata,
        );
      }
      if (result?.previousFollowing) {
        queryClient.setQueryData<SchoolFollowing>(
          followingQueryKey,
          result.previousFollowing,
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
