import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { About } from "./components/about";
import { Posts } from "./components/posts";
import { Roster } from "./components/Roster";
import { StudioBanner } from "./components/banner"
import { References } from "./components/references";
import { Tabs, TabsContent, TabsList, TabsTab } from "@/components/ui/tabs";
import { useState } from "react";
import type { Post, PostsProps } from "./types";
import { Schedule } from "./components/schedule";

const dummy_posts: Post[] = [
{
    id: "1",
    caption: "Amber is this week's 5280 Senior Shoutout! 🔥",
    createdAt: "04-07-2026",
    imageUrl: "https://images.unsplash.com/photo-1590803246097-7be47831ab35?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8ZGFuY2VyfGVufDB8fDB8fHww",
  },
  {
    id: "2",
    caption: "Putting in the work today at the studio",
    createdAt: "04-06-2026",
    imageUrl: "https://images.unsplash.com/photo-1560088161-ca82e528afc9?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "3",
    caption: "Getting ready to rock it at regionals",
    createdAt: "04-05-2026",
    imageUrl: "https://images.unsplash.com/photo-1593105722399-0ee263656fdd?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGRhbmNlJTIwY2xhc3N8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: "4",
    caption: "New roster announcements soon 👀",
    createdAt: "04-04-2026",
    imageUrl: "https://images.unsplash.com/photo-1550026593-cb89847b168d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGRhbmNlJTIwY2xhc3N8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: "5",
    caption: "Natalie at last week's competition up in Lyons",
    createdAt: "04-03-2026",
    imageUrl: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGRhbmNpbmd8ZW58MHx8MHx8fDA%3D",
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
            <TabsTab value="schedule" className="px-5 py-2 text-sm">
              Schedule
            </TabsTab>
          </TabsList>

          <TabsContent value="bio">
            <About description="We are a Boulder-based dance studio focused on contemporary, ballet, and performance training. Established in 2004, 5280 Dance Company provides 
            dancers of all ages with a space to grow, train, and perform. We showcase our competitive dance team here on Studio2Stadium. If you are a recruiter looking to learn more about
            any of our talent please reach out!" />
          </TabsContent>

          <TabsContent value="media">
            <Posts posts={dummy_posts} />
          </TabsContent>

          <TabsContent value="roster">
            <Roster />
          </TabsContent>
           <TabsContent value="schedule">
            <Schedule />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}