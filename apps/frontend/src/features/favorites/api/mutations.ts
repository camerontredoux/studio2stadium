import { $api } from "@/lib/api/client";
import { favoritesQueries } from "./queries";

export function useUpdateFavorite() {
  return $api.useMutation("patch", "/schools/me/favorites/{id}", {
    meta: {
      invalidateQueries: [favoritesQueries.favorites().queryKey],
    },
  });
}
