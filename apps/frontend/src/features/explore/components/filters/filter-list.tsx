import { FilterItem } from "@/components/shared/filters/filter-item";
import type { FilterValue } from "@/components/shared/filters/types";
import { Accordion } from "@/components/ui/accordion";
import type { ApiSchemas } from "@/lib/api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTransition } from "react";
import { exploreQueries } from "../../api/queries";

type Filter = ApiSchemas["SchoolsFiltersResponse"][number];

function ConnectedFilterItem({ filter }: { filter: Filter }) {
  const value = useSearch({
    from: "/_app/(routes)/explore/",
    select: (search) => search[filter.paramKey],
  });
  const navigate = useNavigate({ from: "/explore/" });

  const [, startTransition] = useTransition();

  const onFilterChange = (
    value: FilterValue,
    options?: { replace?: boolean },
  ) => {
    startTransition(() => {
      navigate({
        replace: options?.replace,
        search: (prev) => ({ ...prev, [filter.paramKey]: value }),
      });
    });
  };

  return (
    <FilterItem filter={filter} value={value} onFilterChange={onFilterChange} />
  );
}

export function FilterList() {
  const { data } = useSuspenseQuery(exploreQueries.filters());

  return (
    <Accordion defaultValue={[data[0].id]}>
      {data.map((filter) => (
        <ConnectedFilterItem key={filter.id} filter={filter} />
      ))}
    </Accordion>
  );
}
