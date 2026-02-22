import { SubmissionsPage } from "@/features/recruiting/components/submissions/submissions-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recruiting/")({
  component: SubmissionsPage,
});
