import { Sidebar } from "@/features/feed/components/sidebar/sidebar";
import { Feed } from "./feed";

export function Page() {
  return (
    <div className="flex gap-2 lg:gap-4">
      <Feed />
      <Sidebar />
    </div>
  );
}
