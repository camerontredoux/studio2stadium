import { SidebarLayout } from "@/components/layouts/sidebar-layout";
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

const studio_tabs = ["bio", "media", "roster"] as const;

export function StudioPage() {
  const [activeTab, setActiveTab] =
    useState<(typeof studio_tabs)[number]>("bio");

  return (
    <SidebarLayout
      sidebar={<References />}
      tabs={{ contentLabel: "Studio", sidebarLabel: "Contact Info" }}
    >
      <div className="flex flex-col gap-3 lg:gap-4">
        <StudioBanner />

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as (typeof studio_tabs)[number])}
        >
          <TabsList className="mb-4">
            <TabsTab value="bio" className="px-5 py-2 text-sm">
              Bio
            </TabsTab>
            <TabsTab value="media" className="px-5 py-2 text-sm">
              Media
            </TabsTab>
            <TabsTab value="roster" className="px-5 py-2 text-sm">
              Roster
            </TabsTab>
          </TabsList>

          <TabsContent value="bio">
            <About description="A Boulder-based dance studio focused on contemporary, ballet, and performance training. We create a supportive space for dancers to grow, train, and perform." />
          </TabsContent>

          <TabsContent value="media">
            <Posts posts={dummy_posts} />
          </TabsContent>

          <TabsContent value="roster">
            <Roster />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}