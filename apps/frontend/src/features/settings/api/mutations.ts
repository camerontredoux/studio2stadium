import { $api } from "@/lib/api/client";
import { sessionQueries } from "@/lib/session/queries";
import { accountQueries } from "./queries";

export function useUpdateAccount() {
  return $api.useMutation("patch", "/users/account", {
    meta: {
      invalidateQueries: [
        accountQueries.account().queryKey,
        sessionQueries.all(),
      ],
    },
  });
}

export function useUpdatePassword() {
  return $api.useMutation("post", "/auth/password/change");
}

export function useDeleteAccount() {
  return $api.useMutation("delete", "/users/account");
}

export function useManage() {
  return $api.useMutation("post", "/subscriptions/manage");
}
