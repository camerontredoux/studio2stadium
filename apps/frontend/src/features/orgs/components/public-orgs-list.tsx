import { OrgList } from "@/components/shared/org-list";
import { Spinner } from "@/components/ui/spinner";
import { publicOrgsQueries } from "@/features/orgs/api/queries";
import { useQuery } from "@tanstack/react-query";

export function PublicOrgsList() {
  const { data, isPending, isError } = useQuery(publicOrgsQueries.list());

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <Spinner label="Loading organizations..." />
      </div>
    );
  }

  if (isError || !data?.length) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        No organizations are available right now.
      </p>
    );
  }

  return (
    <OrgList
      orgs={data}
      getLink={() => ({
        to: "/o/$orgSlug/login",
        subtitle: "Sign in",
      })}
    />
  );
}
