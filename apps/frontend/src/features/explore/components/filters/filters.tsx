import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Suspense } from "react";
import { FilterList } from "./filter-list";

export function Filters() {
  return (
    <Accordion multiple defaultValue={["school-name"]}>
      <Suspense
        fallback={
          <AccordionItem className="px-5">
            <AccordionTrigger>Loading...</AccordionTrigger>
          </AccordionItem>
        }
      >
        <FilterList />
      </Suspense>
    </Accordion>
  );
}
