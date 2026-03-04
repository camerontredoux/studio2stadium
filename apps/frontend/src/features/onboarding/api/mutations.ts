import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export const useCreateDancer = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return $api.useMutation("post", "/dancers", {
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: ["session"] });
      navigate({ to: "/checkout", replace: true });
    },
  });
};

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return $api.useMutation("post", "/application", {
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: ["application"] });
      navigate({ to: "/settings/application", replace: true });
    },
  });
};
