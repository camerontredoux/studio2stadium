import { ContentCard } from "@/components/shared/content-card";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import type { Blog } from "./mock-data";

interface BlogCardProps {
  blog: Blog;
}

export function BlogCard({ blog }: BlogCardProps) {
  return (
    <ContentCard
      image={blog.image}
      imageAlt={blog.title}
      title={blog.title}
      footer={<Button size="xs">Read More</Button>}
    >
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarIcon className="size-3.5 shrink-0" />
        <span>{blog.date}</span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">
        {blog.description}
      </p>
    </ContentCard>
  );
}
