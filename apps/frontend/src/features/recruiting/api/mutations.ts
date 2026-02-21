import { $api } from "@/lib/api/client";
import { recruitingQueries } from "./queries";

export function useSubmitVideo() {
  return $api.useMutation("post", "/dancers/submissions", {
    meta: {
      invalidateQueries: [recruitingQueries.submissions().queryKey],
    },
  });
}
