import { $api } from "@/lib/api/client";
import { sessionQueries } from "@/lib/session/queries";
import { schoolQueries } from "./queries";

export function useUpdateSchoolProfile() {
  return $api.useMutation("patch", "/schools/me/profile", {
    meta: {
      invalidateQueries: [
        schoolQueries.settings.profile().queryKey,
        sessionQueries.all(),
      ],
    },
  });
}
