import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { FilterSidebar } from "./components/filter-sidebar";
import { ExploreFilterSheet } from "./components/filters/filter-sheet";

import { SchoolList } from "./components/schools/school-list";

export function ExplorePage() {
  return (
    <SidebarLayout sidebar={<FilterSidebar />}>
      <div className="flex flex-col gap-2 pt-1 max-lg:pb-14 sm:pt-0 lg:gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-col max-sm:pl-1">
            <h1 className="text-2xl leading-none font-bold tracking-tight">
              Explore Schools
            </h1>
            <p className="text-muted-foreground text-sm">
              Discover top dance programs and find your perfect fit
            </p>
          </div>
          <div className="lg:hidden">
            <ExploreFilterSheet />
          </div>
        </div>

        <SchoolList />
      </div>
    </SidebarLayout>
  );
}
