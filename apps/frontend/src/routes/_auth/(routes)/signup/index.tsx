import { ChooseType } from "@/features/signup/components/choose-type";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/signup/")({
  component: ChooseType,
});
