import { ContentCard } from "@/components/shared/content-card";
import { Button } from "@/components/ui/button";
import { BookOpenIcon, CalendarIcon } from "lucide-react";

export interface Blog {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
}

interface BlogCardProps {
  blog: Blog;
}

export function BlogCard({ blog }: BlogCardProps) {
  return (
    <ContentCard
      image={blog.image}
      imageAlt={blog.title}
      title={blog.title}
      footer={
        <Button size="xs" className="gap-1.5">
          <BookOpenIcon /> Read More
        </Button>
      }
    >
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
        <CalendarIcon className="size-3.5 shrink-0" />
        <span>{blog.date}</span>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
        {blog.description}
      </p>
    </ContentCard>
  );
}
