import { createFileRoute } from '@tanstack/react-router'
import { PartnersPage } from "@/features/partners/page";

export const Route = createFileRoute('/_app/(routes)/resources/partners')({
  component: PartnersPage,
})