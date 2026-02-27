import { FilterItem } from "@/components/shared/filters/filter-item";
import type { FilterValue } from "@/components/shared/filters/types";
import { Accordion } from "@/components/ui/accordion";
import type { ApiSchemas } from "@/lib/api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTransition } from "react";
import { exploreQueries } from "../../../api/queries";

type Filter = ApiSchemas["DancersFiltersResponse"][number];

function ConnectedFilterItem({ filter }: { filter: Filter }) {
  const value = useSearch({
    from: "/_app/(routes)/dancers",
    select: (search) => search[filter.paramKey],
  });
  const navigate = useNavigate({ from: "/dancers" });

  const [, startTransition] = useTransition();

  const onFilterChange = (
    value: FilterValue,
    options?: { replace?: boolean },
  ) => {
    startTransition(() => {
      navigate({
        replace: options?.replace,
        search: (prev) => ({
          ...prev,
          [filter.paramKey]: value,
          page: undefined,
        }),
      });
    });
  };

  return (
    <FilterItem filter={filter} value={value} onFilterChange={onFilterChange} />
  );
}

export function FilterList() {
  const { data } = useSuspenseQuery(exploreQueries.dancersFilters());

  return (
    <Accordion defaultValue={[data[0].id]}>
      {data.map((filter) => (
        <ConnectedFilterItem key={filter.id} filter={filter} />
      ))}
    </Accordion>
  );
}
