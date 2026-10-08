import { FaqPage } from "@/features/faq/page";
import { createFileRoute } from "@tanstack/react-router";

// Available to both dancers and schools; the page renders the FAQ content for
// the signed-in account type.
export const Route = createFileRoute("/_app/(routes)/faq/")({
  component: FaqPage,
});
