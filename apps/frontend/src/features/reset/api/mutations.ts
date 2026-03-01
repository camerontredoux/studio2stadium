import { $api } from "@/lib/api/client";
import { useNavigate } from "@tanstack/react-router";

export const useResetPassword = () => {
  const navigate = useNavigate();

  return $api.useMutation("post", "/auth/password/reset", {
    onSuccess: () => {
      navigate({
        to: "/login",
        replace: true,
        search: { reason: "password_reset" },
      });
    },
  });
};
