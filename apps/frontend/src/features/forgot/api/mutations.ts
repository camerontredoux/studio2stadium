import { $api } from "@/lib/api/client";
import { useNavigate } from "@tanstack/react-router";

export const useForgotPassword = () => {
  const navigate = useNavigate();

  return $api.useMutation("post", "/auth/password/forgot", {
    onSuccess: () => {
      navigate({
        to: "/login",
        replace: true,
        search: { reason: "password_forgot" },
      });
    },
  });
};
