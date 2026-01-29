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

export function FilterSheet() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Settings2Icon /> Filters
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
          <SheetClose render={<Button variant="ghost" />}>Cancel</SheetClose>
          <Button>Apply Filters</Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  );
}
