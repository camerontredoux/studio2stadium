import { resetSchemas } from "@/features/reset/api/schemas";
import { ResetForm } from "@/features/reset/components/reset-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/reset")({
  validateSearch: resetSchemas.resetSearch,
  component: ResetForm,
});
