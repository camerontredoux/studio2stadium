import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Filters } from "../../filters/filters";

export function FiltersSection() {
  const navigate = useNavigate();
  const filters = useSearch({ from: "/_app/(routes)/explore" });

  const filtering = Object.keys(filters).length > 0;

  const clearFilters = () => {
    navigate({ to: "/explore" });
  };

  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Filters
          <Button
            disabled={!filtering}
            size="xs"
            className="ml-auto"
            variant="destructive-outline"
            onClick={clearFilters}
          >
            Clear
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="flex flex-col">
        <ScrollArea scrollFade className="h-[calc(100vh-8rem)] max-h-fit">
          <Filters />
        </ScrollArea>
      </FramePanel>
    </Frame>
  );
}
