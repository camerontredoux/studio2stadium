import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogPanel,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Image } from "../types";
import { ImageDelete } from "./image-delete";

export function ImageItem({
  image,
  showOwnerControls,
}: {
  image: Image;
  showOwnerControls: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger>
        <div className="bg-muted group relative aspect-square cursor-pointer overflow-hidden rounded-lg">
          <img
            src={image.thumbnail ?? undefined}
            alt={image.caption || "Gallery image"}
            className="size-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl overflow-clip"
      >
        <DialogPanel className="h-full p-0">
          <img
            src={image.mediaUrl ?? undefined}
            alt={image.caption || "Gallery image"}
            className="absolute z-10 flex h-full w-full items-center justify-center object-contain"
          />
          <img
            src={image.mediaUrl ?? undefined}
            alt={image.caption || "Gallery image"}
            className="h-full w-full object-cover opacity-20 blur-md"
          />
        </DialogPanel>
        <DialogFooter>
          {showOwnerControls ? (
            <ImageDelete key={image.id} id={image.id} />
          ) : null}
          <DialogClose render={<Button variant="secondary">Close</Button>}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
