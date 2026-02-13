import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return $api.useMutation("post", "/auth/logout", {
    onMutate: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
    retry: 3,
  });
};
