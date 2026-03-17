import { $api } from "@/lib/api/client";

export function useDeleteLibraryVideo() {
  return $api.useMutation("delete", "/admin/library/videos/{id}");
}
