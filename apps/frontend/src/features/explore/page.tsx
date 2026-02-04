import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { Badge } from "@/components/ui/badge";
import { FilterSidebar } from "./components/filter-sidebar";
import { ExploreFilterSheet } from "./components/filters/filter-sheet";

import { SchoolList } from "./components/school-list";

export function ExplorePage() {
  return (
    <SidebarLayout sidebar={<FilterSidebar />}>
      <div className="flex pt-1 sm:pt-0 flex-col gap-2 lg:gap-4 max-lg:pb-14">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex flex-col max-sm:pl-1">
            <div className="flex items-end gap-2">
              <h1 className="text-2xl font-bold tracking-tight leading-none">
                Explore Schools
              </h1>
              <Badge variant="brand">{} programs</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
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
