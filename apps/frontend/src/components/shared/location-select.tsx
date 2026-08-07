"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";
import { ChevronsUpDownIcon, SearchIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { US_STATES, CA_PROVINCES } from "@/utils/constants/states";

type Country = "US" | "CA";

const COUNTRIES: { value: Country; label: string }[] = [
  { value: "US", label: "United States of America" },
  { value: "CA", label: "Canada" },
];

const REGIONS_BY_COUNTRY: Record<Country, Record<string, string>> = {
  US: US_STATES,
  CA: CA_PROVINCES,
};

// A stored 2-letter code implies its country — US state and CA province codes
// never overlap — so the country is derived, not stored.
function countryForCode(code: string | null | undefined): Country {
  return code && code in CA_PROVINCES ? "CA" : "US";
}

interface LocationSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

export default function LocationSelect({
  value,
  onChange,
}: LocationSelectProps) {
  const [country, setCountry] = useState<Country>(() => countryForCode(value));

  // Follow the stored value's country when it loads or changes to a code from
  // the other country (e.g. an async profile fetch on the edit form). This runs
  // only when `value` changes — deliberately NOT on `country` — so setting the
  // country here can't re-trigger the effect. An empty value (set when the user
  // switches country to clear the region) is ignored, so the country choice
  // sticks.
  //
  // This was previously done by adjusting state during render. That caused an
  // infinite "Maximum update depth exceeded" loop: LocationSelect re-rendered on
  // every commit, which thrashed the child Base UI Select's layout effects (the
  // setState surfaced from a layout-effect cleanup in <SelectTrigger>).
  useEffect(() => {
    if (value && countryForCode(value) !== country) {
      setCountry(countryForCode(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const regionMap = REGIONS_BY_COUNTRY[country];
  const regionNoun = country === "CA" ? "province/territory" : "state";
  const regionNounPlural =
    country === "CA" ? "provinces/territories" : "states";
  // Items, the controlled `value`, and `onValueChange` all use a single shape —
  // the region code string. The empty/unselected state is a null `value` (not a
  // null item — Base UI reads `.value` on every item and a raw null throws), and
  // its placeholder text lives on <ComboboxValue> below.
  //
  // `items` and `itemToStringLabel` MUST keep a stable identity across renders.
  // Base UI's Combobox feeds them into memos that several layout effects depend
  // on (syncSelectedIndex, etc.); a fresh array/function each render re-runs
  // those effects, which call setState, which re-renders — an infinite
  // "Maximum update depth exceeded" loop. `regionMap` is a module-level constant
  // reference (stable per country), so keying the memos on it is safe.
  const regionCodes = useMemo(() => Object.keys(regionMap), [regionMap]);
  const labelForCode = useCallback(
    (code: string) => regionMap[code] ?? "",
    [regionMap],
  );

  const selectedCode = value && value in regionMap ? value : null;

  return (
    <div className="flex w-full flex-col gap-2">
      {/*
        The country Select gets its OWN Field.Root context. Parent forms wrap
        this whole component in a Base UI <Field> (labelable context), which
        expects a single control. With both the country Select and the region
        Combobox registering against that one context, they fight over its
        control id via useLabelableId — an infinite setControlId toggle
        ("Maximum update depth exceeded"). Scoping the Select to its own field
        leaves only the Combobox in the outer Field, so the "State" label still
        associates with the actual region input.
      */}
      <FieldPrimitive.Root>
        <Select
          items={COUNTRIES}
          value={country}
          onValueChange={(next) => {
            setCountry(next as Country);
            // The previously selected region belongs to the old country; clear it.
            onChange("");
          }}
        >
          <SelectTrigger className="w-full justify-between font-normal">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </FieldPrimitive.Root>

      <Combobox
        onValueChange={(code) => {
          onChange(code ?? "");
        }}
        value={selectedCode}
        items={regionCodes}
        itemToStringLabel={labelForCode}
        autoHighlight
      >
        <ComboboxTrigger
          render={
            <Button
              className="w-full justify-between font-normal"
              variant="outline"
            />
          }
        >
          <ComboboxValue>
            {(code: string | null) =>
              code ? regionMap[code] : `Select ${regionNoun}`
            }
          </ComboboxValue>
          <ChevronsUpDownIcon className="-me-1!" />
        </ComboboxTrigger>
        <ComboboxPopup aria-label={`Select ${regionNoun}`}>
          <div className="border-b p-2">
            <ComboboxInput
              size="sm"
              className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
              placeholder={country === "CA" ? "e.g. Alberta" : "e.g. Colorado"}
              showTrigger={false}
              startAddon={<SearchIcon />}
            />
          </div>
          <ComboboxEmpty>No {regionNounPlural} found.</ComboboxEmpty>
          <ComboboxList>
            {(code: string) => (
              <ComboboxItem key={code} value={code}>
                {regionMap[code]}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
    </div>
  );
}
