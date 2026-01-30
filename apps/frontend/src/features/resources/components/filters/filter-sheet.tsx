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
import { useNavigate } from "@tanstack/react-router";
import { Settings2Icon } from "lucide-react";

export function FilterSheet() {
  const navigate = useNavigate({ from: "/resources" });

  const clearFilters = () => {
    navigate({ to: "/resources" });
  };

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
            Filter videos by category, style, and more
          </SheetDescription>
        </SheetHeader>
        <SheetContent>
          <div className="px-5 py-4 text-sm text-muted-foreground">
            Filters coming soon
          </div>
        </SheetContent>
        <SheetFooter>
          <SheetClose render={<Button variant="ghost" />}>Finish</SheetClose>
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
                  render={
                    <Button variant="destructive" onClick={clearFilters} />
                  }
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
