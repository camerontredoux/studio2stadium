import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlayIcon } from "lucide-react";
import type { FeedItem } from "../types";

interface FeedVideoProps {
  item: FeedItem;
}

export function FeedVideo({ item }: FeedVideoProps) {
  return (
    <Dialog>
      <DialogTrigger className="block w-full">
        <div className="group relative aspect-video cursor-pointer overflow-hidden">
          <img
            src={`https://img.youtube.com/vi/${item.content}/hqdefault.jpg`}
            alt="Feed Item"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-linear-to-t from-black/80 to-transparent">
            <PlayIcon className="size-10 text-white transition-transform duration-150 group-hover:scale-125" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl overflow-clip"
      >
        <iframe
          src={`https://www.youtube.com/embed/${item.content}`}
          title="Feed Item"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video h-full w-full"
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Close</Button>}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
