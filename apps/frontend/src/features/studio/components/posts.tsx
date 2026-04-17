import {
    Frame,
    FrameHeader,
    FramePanel,
    FrameTitle,
  } from "@/components/ui/frame";
  
import type { Post, PostsProps } from "../types";
  
  export function Posts({ posts }: PostsProps) {
    return (
      <Frame className="h-fit w-full">
        <FrameHeader>
          <FrameTitle>Posts</FrameTitle>
        </FrameHeader>
  
        <FramePanel>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="overflow-hidden rounded-lg border bg-background"
                >
                  {post.imageUrl ? (
                    <div className="aspect-square w-full overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.caption || "Post image"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
  
                  <div className="p-3">
                    <p className="text-muted-foreground mb-2 text-xs">
                      {post.createdAt}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {post.caption || "No caption"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No posts yet</div>
          )}
        </FramePanel>
      </Frame>
    );
  }