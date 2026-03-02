import { SchoolSubmissionsPage } from "@/features/recruiting/components/school";
import { SubmissionsPage } from "@/features/recruiting/components/submissions/submissions-page";
import { useSession } from "@/lib/session";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recruiting/")({
  component: RecruitingIndexPage,
});

function RecruitingIndexPage() {
  const session = useSession();

  if (session.type === "school") {
    return <SchoolSubmissionsPage />;
  }

  return <SubmissionsPage />;
}
