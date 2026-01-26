import { $api } from "@/lib/api/client";
import { useNavigate } from "@tanstack/react-router";

export const useSignup = () => {
  const navigate = useNavigate();

  return $api.useMutation("post", "/auth/signup", {
    onSuccess: async () => {
      navigate({
        to: "/login",
        replace: true,
        search: { redirect: "/onboarding", reason: "new_account" },
      });
    },
    onError: (error) => {
      if (error instanceof TypeError) {
        navigate({
          to: "/signup",
          replace: true,
          search: { reason: "network_error" },
        });
        return;
      }
    },
  });
};
