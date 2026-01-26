import { LoginForm } from "@/features/login/components/login-form";
import { schemas } from "@/features/login/schemas";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/login")({
  validateSearch: schemas.search,
  component: LoginForm,
});
