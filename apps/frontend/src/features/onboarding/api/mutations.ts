import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export const useOnboardDancer = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return $api.useMutation("post", "/dancer/onboard", {
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: ["session"] });
      navigate({ to: "/", replace: true });
    },
  });
};
