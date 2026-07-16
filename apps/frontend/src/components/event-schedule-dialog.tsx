import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const EVENT_SCHEDULE_DIALOG_CLASS_NAME =
  "max-sm:h-[100svh] max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0 max-w-5xl overflow-hidden sm:h-auto";

export const EVENT_SCHEDULE_CONTENT_CLASS_NAME =
  "min-h-0 flex-1 overflow-hidden max-sm:p-0 sm:px-6 sm:pb-6 sm:h-[80vh] sm:flex-none";

type EventScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
};

export function EventScheduleDialog({
  open,
  onOpenChange,
  fileUrl,
}: EventScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={EVENT_SCHEDULE_DIALOG_CLASS_NAME}
        bottomStickOnMobile={false}
      >
        <DialogHeader className="shrink-0 max-sm:sr-only">
          <DialogTitle>Event Schedule</DialogTitle>
        </DialogHeader>
        <div className={EVENT_SCHEDULE_CONTENT_CLASS_NAME}>
          {/* An <img> can't be scrolled/zoomed on mobile once it's laid out
              in the page. An iframe hands the file to the browser's native
              PDF/image viewer, which handles pinch-zoom and scrolling for
              both file types itself - it must be the only scroll container
              (no overflow-auto wrapper) or iOS Safari won't forward touch
              scroll into it. */}
          <iframe
            src={fileUrl}
            className="h-full w-full max-sm:border-0 sm:rounded-md sm:border"
            title="Event schedule"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
