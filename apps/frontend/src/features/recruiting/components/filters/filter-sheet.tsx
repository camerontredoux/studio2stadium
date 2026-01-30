import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings2Icon } from "lucide-react";
import { Filters } from "./filters";

interface RecruitingFilterSheetProps {
  prospectStatus: string;
  videoStatus: string;
  onProspectStatusChange: (value: string) => void;
  onVideoStatusChange: (value: string) => void;
  onClear: () => void;
}

export function RecruitingFilterSheet({
  prospectStatus,
  videoStatus,
  onProspectStatusChange,
  onVideoStatusChange,
  onClear,
}: RecruitingFilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="outline" size="sm" className="w-fit" />}
      >
        <Settings2Icon /> Filters
      </SheetTrigger>
      <SheetPopup variant="inset">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Filter submissions by prospect status, video status, and more
          </SheetDescription>
        </SheetHeader>
        <SheetContent>
          <Filters
            prospectStatus={prospectStatus}
            videoStatus={videoStatus}
            onProspectStatusChange={onProspectStatusChange}
            onVideoStatusChange={onVideoStatusChange}
          />
        </SheetContent>
        <SheetFooter>
          <SheetClose render={<Button variant="ghost" />}>Done</SheetClose>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              Clear Filters
            </AlertDialogTrigger>
            <AlertDialogPopup>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Filters</AlertDialogTitle>
                <AlertDialogDescription>
                  Your filters will be reset to the default values.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="ghost" />}>
                  Cancel
                </AlertDialogClose>
                <AlertDialogClose
                  render={<Button variant="destructive" onClick={onClear} />}
                >
                  Clear Filters
                </AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialog>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
