import { ForgotPasswordForm } from "@/features/forgot/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/forgot")({
  component: ForgotPasswordForm,
});
