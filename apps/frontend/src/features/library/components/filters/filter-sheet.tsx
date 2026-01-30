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
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Settings2Icon } from "lucide-react";
import { Filters } from "./filters";

export function ResourcesFilterSheet() {
  const navigate = useNavigate({ from: "/resources/library" });
  const filtering = useSearch({
    from: "/_app/(routes)/resources/library",
    select: (search) => Object.keys(search).length > 0,
  });

  const clearFilters = () => {
    navigate({ to: "/resources/library" });
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
          <Filters />
        </SheetContent>
        <SheetFooter>
          <SheetClose render={<Button variant="ghost" />}>Finish</SheetClose>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button disabled={!filtering} variant="destructive" />}
            >
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
