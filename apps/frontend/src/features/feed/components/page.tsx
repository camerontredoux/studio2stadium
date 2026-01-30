import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { FeedSidebar } from "@/features/feed/components/sidebar/sidebar";
import { Feed } from "./feed";

export function Page() {
  return (
    <SidebarLayout sidebar={<FeedSidebar />}>
      <Feed />
    </SidebarLayout>
  );
}
