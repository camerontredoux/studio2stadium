import { $api } from "@/lib/api/client";
import { adminQueries } from "./queries";

export function useUpdateApplicationStatus() {
  return $api.useMutation("patch", "/admin/applications/{id}/status", {
    meta: {
      invalidateQueries: [adminQueries.applications().queryKey],
    },
  });
}

export function useAddSchoolEvent() {
  return $api.useMutation("post", "/admin/schools/{username}/events");
}

export function useAddGlobalEvent() {
  return $api.useMutation("post", "/admin/events/global");
}
