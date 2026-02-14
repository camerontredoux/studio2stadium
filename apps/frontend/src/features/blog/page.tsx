import { TabsContent } from "@/components/ui/tabs";
import { Suspense } from "react";
import { BlogList } from "./components/blog-list";
import { BlogListSkeleton } from "./components/blog-skeleton";

export function BlogPage() {
  return (
    <TabsContent value="/resources/blog">
      <div className="relative flex flex-col">
        <Suspense fallback={<BlogListSkeleton />}>
          <BlogList />
        </Suspense>
      </div>
    </TabsContent>
  );
}
