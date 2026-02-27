import { $api } from "@/lib/api/client";

export function useUpdateFavorite() {
  return $api.useMutation("patch", "/schools/me/favorites/{id}");
}
