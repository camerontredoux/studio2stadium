import { $api } from "@/lib/api/client";
import { queries } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { redirect } = useSearch({ from: "/_auth/(routes)/login" });
  const navigate = useNavigate();

  return $api.useMutation("post", "/auth/login", {
    onSuccess: async () => {
      queryClient.clear();

      const session = await queryClient.fetchQuery(queries.session());
      navigate({
        to: session?.platforms ? "/onboarding" : (redirect ?? "/feed"),
        replace: true,
      });
    },
    onError: (error) => {
      if (error instanceof TypeError) {
        navigate({
          to: "/login",
          replace: true,
          search: { reason: "network_error" },
        });
        return;
      }

      navigate({
        to: "/login",
        replace: true,
      });
    },
  });
};
