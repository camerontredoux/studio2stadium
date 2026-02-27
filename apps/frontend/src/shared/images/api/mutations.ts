import { schoolQueries } from "@/features/school/api/queries";
import { $api } from "@/lib/api/client";

export function useRequestUpload() {
  return $api.useMutation("post", "/images");
}

export function useUpdateAvatar(username: string) {
  return $api.useMutation("post", "/users/avatar", {
    meta: {
      invalidateQueries: [schoolQueries.profile(username).queryKey],
    },
  });
}
