import { dancerQueries } from "@/features/dancer/api/queries";
import { schoolQueries } from "@/features/school/api/queries";
import { $api } from "@/lib/api/client";

export function useRequestUpload() {
  return $api.useMutation("post", "/images/presign");
}

export function useUpdateAvatar(type: "dancer" | "school", username: string) {
  return $api.useMutation("post", "/users/avatar", {
    meta: {
      invalidateQueries: [
        type === "dancer"
          ? dancerQueries.profile(username).queryKey
          : schoolQueries.profile(username).queryKey,
      ],
    },
  });
}

export function useUploadImage(type: "dancer" | "school", username: string) {
  return $api.useMutation("post", "/images", {
    meta: {
      invalidateQueries: [
        type === "dancer"
          ? dancerQueries.profile(username).queryKey
          : schoolQueries.profile(username).queryKey,
      ],
    },
  });
}
