import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogPanel,
  DialogTrigger,
} from "@/components/ui/dialog";

export function FeedImage({ image }: { image: string }) {
  return (
    <Dialog>
      <DialogTrigger className="block w-full">
        <div className="group relative cursor-pointer overflow-hidden">
          <img
            src={image}
            alt="Feed Item"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 to-transparent group-hover:from-black/40" />
        </div>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl overflow-clip"
      >
        <DialogPanel className="h-full p-0">
          <img
            src={image}
            alt="Feed Item"
            className="absolute z-10 flex h-full w-full items-center justify-center object-contain"
          />
          <img
            src={image}
            alt="Feed Item"
            className="h-full w-full object-cover opacity-20 blur-md"
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Close</Button>}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
