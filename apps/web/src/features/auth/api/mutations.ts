import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { queries } from "./queries";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { redirect } = useSearch({ from: "/_auth/(routes)/login" });
  const navigate = useNavigate();

  return $api.useMutation("post", "/auth/login", {
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: queries.all(),
      });
      navigate({ to: redirect ?? "/", replace: true });
    },
    onError: (error) => {
      navigate({
        to: "/login",
        replace: true,
        search: error.errors ? {} : { reason: "network_error" },
      });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return $api.useMutation("post", "/auth/logout", {
    onMutate: () => {
      queryClient.removeQueries({ queryKey: queries.all() });
      navigate({
        to: "/login",
        replace: true,
      });
    },
    retry: 3,
  });
};
