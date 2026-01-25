import { $api } from "@/lib/api/client";
import { useNavigate, useSearch } from "@tanstack/react-router";

export const useSignup = () => {
  const { redirect } = useSearch({ from: "/_auth/(routes)/signup" });
  const navigate = useNavigate();

  return $api.useMutation("post", "/auth/signup", {
    onSuccess: async () => {
      navigate({ to: redirect ?? "/", replace: true });
    },
    onError: (error) => {
      navigate({
        to: "/signup",
        replace: true,
        search: error.errors ? {} : { reason: "network_error" },
      });
    },
  });
};
