import { useSuspenseQuery } from "@tanstack/react-query";
import { BlogCard } from "./blog-card";
import { blogQueries } from "../api/queries";

export function BlogList() {
  const { data } = useSuspenseQuery(blogQueries.all());

  return (
    <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3 lg:pt-4">
      {data.map((blog) => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
}
