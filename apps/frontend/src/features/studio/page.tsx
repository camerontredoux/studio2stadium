import { About } from "./components/about";
import { Posts } from "./components/posts";
import { Roster } from "./components/roster";
import { StudioBanner } from "./components/banner"
import { References } from "./components/references";
import { Tabs, TabsContent, TabsList, TabsTab } from "@/components/ui/tabs";
import { useState } from "react";
import type { Post, PostsProps } from "./types";

const dummy_posts: Post[] = [
  {
    id: "1",
    caption: "First post on the feed 🔥",
    createdAt: "2026-04-07T10:00:00Z",
    imageUrl: "https://picsum.photos/400/300?random=1",
  },
  {
    id: "2",
    caption: "Training day at the studio",
    createdAt: "2026-04-06T18:30:00Z",
    imageUrl: "https://picsum.photos/400/300?random=2",
  },
  {
    id: "3",
    caption: "No image on this one, just vibes",
    createdAt: "2026-04-05T14:15:00Z",
    imageUrl: null,
  },
  {
    id: "4",
    caption: "New roster announcements soon 👀",
    createdAt: "2026-04-04T09:45:00Z",
    imageUrl: "https://picsum.photos/400/300?random=3",
  },
  {
    id: "5",
    caption: "Late night practice session",
    createdAt: "2026-04-03T22:10:00Z",
    imageUrl: null,
  },
];

const studio_tabs = ["about", "posts", "roster"] as const;

export function StudioPage() {
  const [activeTab, setActiveTab] =
    useState<(typeof studio_tabs)[number]>("about");

  return (
    <div>
      <StudioBanner></StudioBanner>
      <References></References>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as (typeof studio_tabs)[number])}
      >
        <TabsList>
          <TabsTab value="about">About</TabsTab>
          <TabsTab value="posts">Posts</TabsTab>
          <TabsTab value="roster">Roster</TabsTab>
        </TabsList>

        <TabsContent value="about">
          <About description="Description goes here!" />
        </TabsContent>

        <TabsContent value="posts">
          <Posts posts={dummy_posts}/>
        </TabsContent>

        <TabsContent value="roster">
          <Roster />
        </TabsContent>
      </Tabs>
    </div>
  );
}