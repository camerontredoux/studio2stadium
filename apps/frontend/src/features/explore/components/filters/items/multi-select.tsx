import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from "@/components/ui/combobox";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Fragment } from "react";

type Option = { value: string; label: string };

interface MultiSelectFilterProps {
  paramKey: string;
  options: Option[] | undefined;
}

export function MultiSelectFilter({
  paramKey,
  options,
}: MultiSelectFilterProps) {
  const filters = useSearch({ from: "/_app/(routes)/explore" });
  const navigate = useNavigate({ from: "/explore" });

  const selectedValues = filters[paramKey as keyof typeof filters]?.split(",");

  const selected = options?.filter((option) =>
    selectedValues?.includes(option.value),
  );
  console.log(selected);

  const handleSelect = (values: Option[]) => {
    console.log(values);

    navigate({
      search: (prev) => {
        return {
          ...prev,
          [paramKey]: values.map((v) => v.value),
        };
      },
    });
  };

  return (
    <Combobox
      onValueChange={(value) => handleSelect(value)}
      autoHighlight
      multiple
      items={options}
      value={selected}
    >
      <ComboboxChips>
        <ComboboxValue>
          {(value: { value: string; label: string }[]) => (
            <Fragment>
              {value?.map((item) => (
                <ComboboxChip aria-label={item.label} key={item.value}>
                  {item.label}
                </ComboboxChip>
              ))}
              <ComboboxInput
                aria-label="Select filter option"
                placeholder={value.length > 0 ? undefined : "Select a value..."}
              />
            </Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxPopup>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
