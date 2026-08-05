import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/components/utils/cn";
import { PlayIcon } from "lucide-react";

interface SubmissionVideoDialogProps {
  youtubeId: string;
  title: string;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function SubmissionVideoDialog({
  youtubeId,
  title,
  onOpenChange,
  className,
}: SubmissionVideoDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("relative z-10 shrink-0 gap-1", className)}
          />
        }
      >
        <PlayIcon className="size-3" /> Watch Video
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl overflow-clip"
      >
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video min-h-0 w-full shrink"
        />
        <DialogFooter className="shrink-0 sm:justify-end">
          <DialogClose render={<Button variant="secondary" />}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
