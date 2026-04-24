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

export function useEditGlobalEvent() {
  return $api.useMutation("patch", "/admin/events/global/{id}");
}

export function useEditSchoolEvent(username: string) {
  return $api.useMutation("patch", "/admin/events/school/{id}", {
    meta: {
      invalidateQueries: [adminQueries.schoolEvents(username).queryKey],
    },
  });
}

export function useAdminUpdateSchoolProfile(username: string) {
  return $api.useMutation("patch", "/admin/schools/{username}/profile", {
    meta: {
      invalidateQueries: [adminQueries.schools().queryKey, adminQueries.schoolEvents(username).queryKey],
    },
  });
}

export function useAdminUpdateSchoolAccount(username: string) {
  return $api.useMutation("patch", "/admin/schools/{username}/account", {
    meta: {
      invalidateQueries: [adminQueries.schools().queryKey, adminQueries.schoolEvents(username).queryKey],
    },
  });
}

export function useAdminUpdateSchoolSkills(username: string) {
  return $api.useMutation("patch", "/admin/schools/{username}/skills", {
    meta: {
      invalidateQueries: [adminQueries.schools().queryKey, adminQueries.schoolEvents(username).queryKey],
    },
  });
}

export function useAdminUpdateSchoolStyles(username: string) {
  return $api.useMutation("patch", "/admin/schools/{username}/styles", {
    meta: {
      invalidateQueries: [adminQueries.schools().queryKey, adminQueries.schoolEvents(username).queryKey],
    },
  });
}

export function useAdminUpdateSchoolSports(username: string) {
  return $api.useMutation("patch", "/admin/schools/{username}/sports", {
    meta: {
      invalidateQueries: [adminQueries.schools().queryKey, adminQueries.schoolEvents(username).queryKey],
    },
  });
}

export function useAdminUpdateSchoolAvatar(username: string) {
  return $api.useMutation("post", "/admin/schools/{username}/avatar", {
    meta: {
      invalidateQueries: [adminQueries.schools().queryKey, adminQueries.schoolEvents(username).queryKey],
    },
  });
}
