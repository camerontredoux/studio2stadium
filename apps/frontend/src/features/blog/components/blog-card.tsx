import { ContentCard } from "@/components/shared/content-card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/components/utils/format";
import type { ApiSchemas } from "@/lib/api/client";
import { CalendarIcon } from "lucide-react";

type Blog = ApiSchemas["BlogResponse"][number];

interface BlogCardProps {
  blog: Blog;
}

export function BlogCard({ blog }: BlogCardProps) {
  return (
    <ContentCard
      image={blog.thumbnail}
      imageAlt={blog.title}
      title={blog.title}
      footer={
        <Button
          size="xs"
          render={
            <a
              href={`https://marketing.studio2stadium.com/blog/${blog.slug}`}
              target="_blank"
            />
          }
        >
          Read More
        </Button>
      }
    >
      <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <CalendarIcon className="text-brand size-3.5 shrink-0" />
        <span>{formatDate(blog.createdAt)}</span>
      </div>
      <p className="text-muted-foreground line-clamp-3 text-sm">
        {blog.description}
      </p>
    </ContentCard>
  );
}
