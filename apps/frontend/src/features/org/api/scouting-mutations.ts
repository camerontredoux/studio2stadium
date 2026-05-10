import { $api } from "@/lib/api/client";
import { scoutingQueries } from "./scouting-queries";

export function useAddFavorite(slug: string) {
  return $api.useMutation("post", "/orgs/{slug}/favorites", {
    meta: {
      invalidateQueries: [
        scoutingQueries.favorites(slug).queryKey,
        scoutingQueries.dancers(slug).queryKey,
        scoutingQueries.rankings(slug).queryKey,
      ],
    },
  });
}

export function useRemoveFavorite(slug: string) {
  return $api.useMutation(
    "delete",
    "/orgs/{slug}/favorites/{dancerRosterId}",
    {
      meta: {
        invalidateQueries: [
          scoutingQueries.favorites(slug).queryKey,
          scoutingQueries.dancers(slug).queryKey,
          scoutingQueries.rankings(slug).queryKey,
        ],
      },
    },
  );
}

export function useUpsertRating(slug: string) {
  return $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
    {
      meta: {
        invalidateQueries: [scoutingQueries.rankings(slug).queryKey],
      },
    },
  );
}

export function useUpsertNote(slug: string) {
  return $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
    {
      meta: {
        invalidateQueries: [scoutingQueries.rankings(slug).queryKey],
      },
    },
  );
}

export function useDeleteNote(slug: string) {
  return $api.useMutation(
    "delete",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
    {
      meta: {
        invalidateQueries: [scoutingQueries.rankings(slug).queryKey],
      },
    },
  );
}

export function useAddSchoolSelection(slug: string) {
  return $api.useMutation("post", "/orgs/{slug}/my-selections", {
    meta: {
      invalidateQueries: [scoutingQueries.mySelections(slug).queryKey],
    },
  });
}

export function useRemoveSchoolSelection(slug: string) {
  return $api.useMutation("delete", "/orgs/{slug}/my-selections/{id}", {
    meta: {
      invalidateQueries: [scoutingQueries.mySelections(slug).queryKey],
    },
  });
}
