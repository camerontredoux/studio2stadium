import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { adminQueries } from "../api/queries";
import { DancersTable } from "./components/dancers-table";

export function DancersPage() {
  const search = useSearch({ from: "/_admin/(routes)/admin/dancers" });

  const { data, isPending, isPlaceholderData } = useQuery(
    adminQueries.dancers(search),
  );

  if (isPending || !data) {
    return (
      <div className="flex h-24 items-center justify-center gap-2">
        <Loader2Icon className="size-4 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading dancers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dancers</h2>
      <DancersTable
        dancers={data.dancers}
        pagination={data.pagination}
        isLoading={isPlaceholderData}
      />
    </div>
  );
}
