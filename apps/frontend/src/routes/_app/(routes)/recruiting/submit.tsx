import { SubmitPage } from "@/features/recruiting/components/submit/submit-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recruiting/submit")({
  component: SubmitPage,
});
