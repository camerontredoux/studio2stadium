import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { FeedSidebar } from "@/features/feed/components/sidebar/sidebar";
import { Feed } from "./components/feed";

export function FeedPage() {
  return (
    <SidebarLayout sidebar={<FeedSidebar />}>
      <Feed />
    </SidebarLayout>
  );
}
