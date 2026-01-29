import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Suspense } from "react";
import { FilterSidebar } from "./filter-sidebar";
import { FilterSheet } from "./filters/filter-sheet";
import { UserList } from "./user-list";

export function Page() {
  return (
    <SidebarLayout sidebar={<FilterSidebar />}>
      <div className="flex-1">
        <h1>Explore</h1>
      </div>

      <FilterSheet />

      <div className="gap-2">
        <Suspense fallback={<div>Loading...</div>}>
          <UserList />
        </Suspense>
      </div>
    </SidebarLayout>
  );
}
