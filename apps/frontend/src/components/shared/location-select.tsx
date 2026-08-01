"use client";

import { ChevronsUpDownIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

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

interface Region {
  value: string | null;
  label: string;
}

/** Normalize `items` entries (Region objects) and the controlled `value` (region code string). */
function locationItemEquals(a: unknown, b: unknown): boolean {
  const code = (x: unknown) =>
    x != null && typeof x === "object" && "value" in (x as object)
      ? (x as Region).value
      : (x as string | null | undefined);
  return code(a) === code(b);
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
  const [seenValue, setSeenValue] = useState(value);

  // Follow the stored value's country when it loads or changes to a code from
  // the other country (e.g. an async profile fetch on the edit form). Adjusting
  // state during render is React's recommended pattern and avoids a sync effect.
  // An empty value — set when the user switches country to clear the region — is
  // ignored, so the user's country choice sticks.
  if (value !== seenValue) {
    setSeenValue(value);
    const next = countryForCode(value);
    if (value && next !== country) setCountry(next);
  }

  const regionMap = REGIONS_BY_COUNTRY[country];
  const regionNoun = country === "CA" ? "province/territory" : "state";
  const regionNounPlural =
    country === "CA" ? "provinces/territories" : "states";
  const regions: Region[] = [
    { label: `Select ${regionNoun}`, value: null },
    ...Object.entries(regionMap).map(([value, label]) => ({ value, label })),
  ];

  // Root `value` must use the same shape as item values so Base UI can match.
  const selectedCode = value && value in regionMap ? value : null;

  return (
    <div className="flex w-full flex-col gap-2">
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

      <Combobox
        onValueChange={(v) => {
          onChange((v as string) ?? "");
        }}
        value={selectedCode}
        items={regions}
        isItemEqualToValue={locationItemEquals}
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
          <ComboboxValue />
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
            {(region: Region) => (
              <ComboboxItem
                key={region.value ?? "__placeholder__"}
                value={region.value}
              >
                {region.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
    </div>
  );
}
