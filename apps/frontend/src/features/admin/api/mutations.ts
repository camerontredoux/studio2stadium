import { $api } from "@/lib/api/client";
import { adminQueries } from "./queries";

export function useApproveSchool() {
  return $api.useMutation("post", "/admin/schools/{id}/approve", {
    meta: {
      invalidateQueries: [adminQueries.applications().queryKey],
    },
  });
}

export function useAddSchoolEvent() {
  return $api.useMutation("post", "/admin/schools/{schoolId}/events");
}

export function useAddGlobalEvent() {
  return $api.useMutation("post", "/admin/events/global");
}
