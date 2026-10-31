import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import { clearPhoneDrafts } from "./phone-draft";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return $api.useMutation("post", "/auth/logout", {
    // Before the request, so an expired session's 401 redirect can't skip it.
    onMutate: () => {
      clearPhoneDrafts();
    },
    onSuccess: () => {
      posthog.reset(true);
      queryClient.clear();
      window.location.href = "/login";
    },
  });
};
