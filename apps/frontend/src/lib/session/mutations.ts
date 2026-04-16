import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return $api.useMutation("post", "/auth/logout", {
    onSuccess: () => {
      posthog.reset(true);
      queryClient.clear();
      window.location.href = "/login";
    },
  });
};
