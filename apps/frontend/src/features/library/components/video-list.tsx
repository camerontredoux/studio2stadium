import { VIDEO_CATEGORIES } from "@/utils/constants/categories";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TagIcon } from "lucide-react";
import { queries } from "../api/queries";
import { VideosByCategory } from "./videos-by-category";

export function VideoList() {
  const { data } = useSuspenseQuery(queries.videos());

  return data.map((group) => (
    <section key={group.category} className="relative flex flex-col gap-2">
      <div className="sticky top-24 z-10 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="border-brand/20 bg-background/90 flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-sm">
            <TagIcon className="text-brand size-3.5" />
            <span className="text-brand text-sm font-semibold">
              {
                VIDEO_CATEGORIES[
                  group.category as keyof typeof VIDEO_CATEGORIES
                ]
              }
            </span>
          </div>
        </div>
      </div>

      <VideosByCategory group={group} />
    </section>
  ));
}
