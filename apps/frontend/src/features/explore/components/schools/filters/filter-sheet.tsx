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
import { Badge } from "@/components/ui/badge";
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

export function SchoolsFilterSheet() {
  const navigate = useNavigate({ from: "/explore/" });
  const filters = useSearch({
    from: "/_app/(routes)/explore/",
    select: (search) =>
      Object.keys(search).filter(
        (k) => search[k as keyof typeof search] !== undefined,
      ).length,
  });

  const clearFilters = () => {
    navigate({ to: "/explore" });
  };

  return (
    <Sheet>
      <SheetTrigger
        className="relative"
        render={<Button variant="outline" size="sm" />}
      >
        <Settings2Icon /> Filters
        {filters ? (
          <Badge
            className="absolute -top-1.5 -right-1.5 rounded-full"
            variant="warning"
          >
            {filters}
          </Badge>
        ) : null}
      </SheetTrigger>
      <SheetPopup variant="inset">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Comprehensive filters to help you find the perfect match
          </SheetDescription>
        </SheetHeader>
        <SheetContent>
          <Filters />
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
