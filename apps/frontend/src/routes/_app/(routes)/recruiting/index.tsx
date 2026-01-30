import { SubmissionsPage } from "@/features/recruiting/submissions-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recruiting/")({
  component: SubmissionsPage,
});
