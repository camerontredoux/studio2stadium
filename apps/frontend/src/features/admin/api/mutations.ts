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

export function useAdminUploadSchoolImage(username: string) {
  return $api.useMutation("post", "/admin/schools/{username}/images", {
    meta: {
      invalidateQueries: [adminQueries.schoolEvents(username).queryKey],
    },
  });
}

export function useAdminDeleteSchoolImage(username: string) {
  return $api.useMutation("delete", "/admin/schools/{username}/images/{id}", {
    meta: {
      invalidateQueries: [adminQueries.schoolEvents(username).queryKey],
    },
  });
}

export function useAdminDeleteSchoolVideo(username: string) {
  return $api.useMutation("delete", "/admin/schools/{username}/videos/{id}", {
    meta: {
      invalidateQueries: [adminQueries.schoolEvents(username).queryKey],
    },
  });
}

export function useCreateOrg() {
  return $api.useMutation("post", "/admin/orgs", {
    meta: {
      invalidateQueries: [adminQueries.orgs().queryKey],
    },
  });
}

export function useUpdateOrg() {
  return $api.useMutation("patch", "/admin/orgs/{id}", {
    meta: {
      invalidateQueries: [adminQueries.orgs().queryKey],
    },
  });
}

export function useDeleteOrg() {
  return $api.useMutation("delete", "/admin/orgs/{id}", {
    meta: {
      invalidateQueries: [adminQueries.orgs().queryKey],
    },
  });
}

export function useAddOrgMember(orgId: string) {
  return $api.useMutation("post", "/admin/orgs/{id}/members", {
    meta: {
      invalidateQueries: [
        adminQueries.orgs().queryKey,
        adminQueries.orgMembers(orgId).queryKey,
      ],
    },
  });
}

export function useUpdateOrgMember(orgId: string) {
  return $api.useMutation("patch", "/admin/orgs/{id}/members/{memberId}", {
    meta: {
      invalidateQueries: [
        adminQueries.orgMembers(orgId).queryKey,
      ],
    },
  });
}

export function useRemoveOrgMember(orgId: string) {
  return $api.useMutation("delete", "/admin/orgs/{id}/members/{memberId}", {
    meta: {
      invalidateQueries: [
        adminQueries.orgs().queryKey,
        adminQueries.orgMembers(orgId).queryKey,
      ],
    },
  });
}
