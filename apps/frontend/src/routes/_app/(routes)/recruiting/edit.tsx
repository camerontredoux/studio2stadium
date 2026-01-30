import { EditPage } from "@/features/recruiting/edit-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recruiting/edit")({
  component: EditPage,
});
