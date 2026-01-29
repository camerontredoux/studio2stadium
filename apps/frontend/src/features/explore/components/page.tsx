import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { useSearch } from "@tanstack/react-router";
import { Suspense } from "react";
import { FilterSheet } from "./filters/filter-sheet";
import { ExploreSidebar } from "./sidebar/sidebar";
import { UserList } from "./user-list";

export function Page() {
  const search = useSearch({ from: "/_app/(routes)/explore" });

  return (
    <SidebarLayout sidebar={<ExploreSidebar />}>
      <div className="flex-1">
        <h1>Explore</h1>
      </div>
      {JSON.stringify(search, null, 2)}

      <FilterSheet />

      <div className="gap-2">
        <Suspense fallback={<div>Loading...</div>}>
          <UserList />
        </Suspense>
      </div>
    </SidebarLayout>
  );
}
