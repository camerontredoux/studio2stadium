import { $api } from "@/lib/api/client";

export function useCreateLibraryVideo() {
  return $api.useMutation("post", "/admin/library/videos");
}

export function useDeleteLibraryVideo() {
  return $api.useMutation("delete", "/admin/library/videos/{id}");
}
