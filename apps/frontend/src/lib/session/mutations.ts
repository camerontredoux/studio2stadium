import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return $api.useMutation("post", "/auth/logout", {
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });
};
