import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { SchoolFiltersSidebar } from "./components/schools/filters/filter-sidebar";

import { useSession } from "@/lib/session";
import { DancerList } from "./components/dancers/dancer-list";
import { DancersFilterSheet } from "./components/dancers/filters/filter-sheet";
import { DancerFiltersSidebar } from "./components/dancers/filters/filter-sidebar";
import { SchoolsFilterSheet } from "./components/schools/filters/filter-sheet";
import { SchoolList } from "./components/schools/school-list";

export function ExplorePage() {
  const session = useSession();

  return (
    <SidebarLayout
      sidebar={
        session.type === "school" ? (
          <DancerFiltersSidebar />
        ) : (
          <SchoolFiltersSidebar />
        )
      }
    >
      <div className="mobile:pb-14 flex flex-col gap-2 pt-1 sm:pt-0 lg:gap-4">
        <div className="flex justify-between gap-2 sm:flex-row sm:gap-4">
          <div className="flex flex-col max-sm:pl-1">
            <h1 className="text-2xl leading-none font-bold tracking-tight">
              {session.type === "dancer"
                ? "Explore Schools"
                : "Explore Dancers"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {session.type === "dancer"
                ? "Discover dance programs and find the perfect fit"
                : "Discover dancers who are looking for a school"}
            </p>
          </div>
          <div className="lg:hidden">
            {session.type === "school" ? (
              <DancersFilterSheet />
            ) : (
              <SchoolsFilterSheet />
            )}
          </div>
        </div>

        {session.type === "dancer" ? <SchoolList /> : <DancerList />}
      </div>
    </SidebarLayout>
  );
}
