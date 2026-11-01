import { dancerQueries } from "@/features/dancer/api/queries";
import { schoolQueries } from "@/features/school/api/queries";
import { $api } from "@/lib/api/client";
import { videoQueries } from "./queries";

export function useDeleteVideo(type: "dancer" | "school", username: string) {
  return $api.useMutation("delete", "/videos/{id}", {
    meta: {
      invalidateQueries: [
        type === "dancer"
          ? dancerQueries.profile(username).queryKey
          : schoolQueries.profile(username).queryKey,
        videoQueries.permissions().queryKey,
      ],
    },
  });
}
