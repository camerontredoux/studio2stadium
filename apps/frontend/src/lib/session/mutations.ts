import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return $api.useMutation("post", "/auth/logout", {
    onMutate: () => {
      queryClient.clear();
      navigate({
        to: "/login",
        replace: true,
      });
    },
    retry: 3,
  });
};
