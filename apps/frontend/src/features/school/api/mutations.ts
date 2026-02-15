import { $api, type ApiSchemas } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { schoolQueries } from "./queries";

type Metadata = ApiSchemas["SchoolsIdMetadataResponse"];

export function useFollowSchool(id: string) {
  const queryClient = useQueryClient();

  return $api.useMutation("post", "/schools/{id}/follow", {
    meta: {
      invalidateQueries: [schoolQueries.metadata(id).queryKey],
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: schoolQueries.metadata(id).queryKey,
      });

      const previousData = queryClient.getQueryData<Metadata>(
        schoolQueries.metadata(id).queryKey,
      );

      queryClient.setQueryData<Metadata>(
        schoolQueries.metadata(id).queryKey,
        (old) => {
          if (!old) return;
          return {
            ...old,
            followers: old.followers + 1,
            following: true,
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      const result = context as { previousData: Metadata | undefined };
      if (result?.previousData) {
        queryClient.setQueryData<Metadata>(
          schoolQueries.metadata(id).queryKey,
          result.previousData,
        );
      }
    },
  });
}

export function useUnfollowSchool(id: string) {
  const queryClient = useQueryClient();

  return $api.useMutation("delete", "/schools/{id}/follow", {
    meta: {
      invalidateQueries: [schoolQueries.metadata(id).queryKey],
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: schoolQueries.metadata(id).queryKey,
      });

      const previousData = queryClient.getQueryData<Metadata>(
        schoolQueries.metadata(id).queryKey,
      );

      queryClient.setQueryData<Metadata>(
        schoolQueries.metadata(id).queryKey,
        (old) => {
          if (!old) return;
          return {
            ...old,
            followers: old.followers - 1,
            following: false,
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      const result = context as { previousData: Metadata | undefined };
      if (result?.previousData) {
        queryClient.setQueryData<Metadata>(
          schoolQueries.metadata(id).queryKey,
          result.previousData,
        );
      }
    },
  });
}
