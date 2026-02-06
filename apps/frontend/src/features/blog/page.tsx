import { TabsContent } from "@/components/ui/tabs";
import { BlogCard } from "@/features/blog/components/blog-card";
import { MOCK_BLOGS } from "@/features/blog/components/mock-data";

export function BlogPage() {
  return (
    <TabsContent value="/resources/blog">
      <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3 lg:pt-4">
        {MOCK_BLOGS.map((blog) => (
          <BlogCard key={blog.id} blog={blog} />
        ))}
      </div>
    </TabsContent>
  );
}
