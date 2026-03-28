import { createFileRoute } from "@tanstack/react-router";
import { StudioPage } from "@/features/studio/page";

export const Route = createFileRoute("/_app/(routes)/studio")({
  component: StudioPage,
});