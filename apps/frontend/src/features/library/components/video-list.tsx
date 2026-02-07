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
      <div className="sticky top-26 z-10 py-2">
        <div className="flex items-center gap-2">
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
      <Separator className="absolute top-6 left-0 -z-10 flex-1" />

      <VideosByCategory group={group} />

      <div className="bg-background absolute top-2 right-0 z-20">
        <ResourcesFilterSheet />
      </div>
    </section>
  ));
}
