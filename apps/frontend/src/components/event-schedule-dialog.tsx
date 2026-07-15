import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const EVENT_SCHEDULE_DIALOG_CLASS_NAME =
  "h-[calc(100svh-2rem)] max-w-5xl overflow-hidden sm:h-auto";

export const EVENT_SCHEDULE_CONTENT_CLASS_NAME =
  "min-h-0 flex-1 overflow-auto px-6 pb-6 sm:h-[80vh] sm:flex-none";

type EventScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  isPdf: boolean;
};

export function EventScheduleDialog({
  open,
  onOpenChange,
  fileUrl,
  isPdf,
}: EventScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={EVENT_SCHEDULE_DIALOG_CLASS_NAME}
        bottomStickOnMobile={false}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Event Schedule</DialogTitle>
        </DialogHeader>
        <div className={EVENT_SCHEDULE_CONTENT_CLASS_NAME}>
          {isPdf ? (
            <iframe
              src={fileUrl}
              className="h-full w-full rounded-md border"
              title="Event schedule"
            />
          ) : (
            <img
              src={fileUrl}
              alt="Event schedule"
              className="h-full w-full rounded-md object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
