import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { FilterList } from "./filter-list";

export function Filters() {
  return (
    <Suspense
      fallback={
        <Accordion multiple defaultValue={["event-name"]}>
          {Array.from({ length: 10 }).map((_, index) => (
            <AccordionItem key={index} className="px-5">
              <AccordionTrigger>
                <Skeleton className="h-4 w-full" />
              </AccordionTrigger>
            </AccordionItem>
          ))}
        </Accordion>
      }
    >
      <FilterList />
    </Suspense>
  );
}
