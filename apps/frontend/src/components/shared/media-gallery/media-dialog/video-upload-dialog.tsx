import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "@/lib/session";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { Link } from "@tanstack/react-router";
import { CrownIcon, VideoIcon } from "lucide-react";
import { useState } from "react";

export function VideoUploadDialog() {
  const [open, setOpen] = useState(false);
  const { subscribed } = useSubscribed();
  const { type } = useSession();

  if (!subscribed && type === "dancer") {
    return (
      <div className="border-border group flex aspect-square flex-1 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed opacity-60">
        <div className="bg-muted rounded-full p-3">
          <VideoIcon className="text-muted-foreground size-6" />
        </div>
        <span className="text-muted-foreground text-sm font-medium">Video</span>
        <Button
          className="hover:text-brand gap-2"
          variant="link"
          size="xs"
          render={<Link to="/checkout" />}
        >
          <CrownIcon className="text-brand size-3" /> Premium Only
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="border-border hover:border-primary/50 hover:bg-primary/5 group flex aspect-square flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors"
          />
        }
      >
        <div className="bg-muted group-hover:bg-primary/10 rounded-full p-3 transition-colors">
          <VideoIcon className="text-muted-foreground group-hover:text-primary size-6 transition-colors" />
        </div>
        <span className="text-muted-foreground group-hover:text-foreground text-sm font-medium transition-colors">
          Video
        </span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Video</DialogTitle>
          <DialogDescription>Add a video to your account.</DialogDescription>
        </DialogHeader>
        <DialogPanel></DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
