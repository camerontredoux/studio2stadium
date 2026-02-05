import { useSuspenseQuery } from "@tanstack/react-query";
import { queries } from "../api/queries";
import { TagIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ResourcesFilterSheet } from "./filters/filter-sheet";
import { VIDEO_CATEGORIES } from "@/utils/constants/categories";
import { VideosByCategory } from "./videos-by-category";

export function VideoList() {
  const { data } = useSuspenseQuery(queries.videos());

  return data.map((group) => (
    <section
      key={group.category}
      className="relative flex flex-col gap-2 lg:gap-3"
    >
      <div className="sticky z-10 top-26 py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-brand/20 bg-background/90 backdrop-blur-sm px-2.5 py-1">
            <TagIcon className="size-3.5 text-brand" />
            <span className="text-sm font-semibold text-brand">
              {
                VIDEO_CATEGORIES[
                  group.category as keyof typeof VIDEO_CATEGORIES
                ]
              }
            </span>
          </div>
        </div>
      </div>
      <Separator className="flex-1 -z-10 absolute top-6 left-0" />

      <VideosByCategory group={group} />

      <div className="absolute right-0 z-20 bg-background top-2">
        <ResourcesFilterSheet />
      </div>
    </section>
  ));
}
