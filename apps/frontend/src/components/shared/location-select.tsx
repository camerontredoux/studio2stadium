"use client";

import { ChevronsUpDownIcon, SearchIcon } from "lucide-react";

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

interface State {
  code: string;
  value: string | null;
  label: string;
}

const states: State[] = [
  { code: "", label: "Select state", value: null },
  { code: "AL", label: "Alabama", value: "alabama" },
  { code: "AK", label: "Alaska", value: "alaska" },
  { code: "AZ", label: "Arizona", value: "arizona" },
  { code: "AR", label: "Arkansas", value: "arkansas" },
  { code: "CA", label: "California", value: "california" },
  { code: "CO", label: "Colorado", value: "colorado" },
  { code: "CT", label: "Connecticut", value: "connecticut" },
  { code: "DE", label: "Delaware", value: "delaware" },
  { code: "FL", label: "Florida", value: "florida" },
  { code: "GA", label: "Georgia", value: "georgia" },
  { code: "HI", label: "Hawaii", value: "hawaii" },
  { code: "ID", label: "Idaho", value: "idaho" },
  { code: "IL", label: "Illinois", value: "illinois" },
  { code: "IN", label: "Indiana", value: "indiana" },
  { code: "IA", label: "Iowa", value: "iowa" },
  { code: "KS", label: "Kansas", value: "kansas" },
  { code: "KY", label: "Kentucky", value: "kentucky" },
  { code: "LA", label: "Louisiana", value: "louisiana" },
  { code: "ME", label: "Maine", value: "maine" },
  { code: "MD", label: "Maryland", value: "maryland" },
  { code: "MA", label: "Massachusetts", value: "massachusetts" },
  { code: "MI", label: "Michigan", value: "michigan" },
  { code: "MN", label: "Minnesota", value: "minnesota" },
  { code: "MS", label: "Mississippi", value: "mississippi" },
  { code: "MO", label: "Missouri", value: "missouri" },
  { code: "MT", label: "Montana", value: "montana" },
  { code: "NE", label: "Nebraska", value: "nebraska" },
  { code: "NV", label: "Nevada", value: "nevada" },
  { code: "NH", label: "New Hampshire", value: "new-hampshire" },
  { code: "NJ", label: "New Jersey", value: "new-jersey" },
  { code: "NM", label: "New Mexico", value: "new-mexico" },
  { code: "NY", label: "New York", value: "new-york" },
  { code: "NC", label: "North Carolina", value: "north-carolina" },
  { code: "ND", label: "North Dakota", value: "north-dakota" },
  { code: "OH", label: "Ohio", value: "ohio" },
  { code: "OK", label: "Oklahoma", value: "oklahoma" },
  { code: "OR", label: "Oregon", value: "oregon" },
  { code: "PA", label: "Pennsylvania", value: "pennsylvania" },
  { code: "RI", label: "Rhode Island", value: "rhode-island" },
  { code: "SC", label: "South Carolina", value: "south-carolina" },
  { code: "SD", label: "South Dakota", value: "south-dakota" },
  { code: "TN", label: "Tennessee", value: "tennessee" },
  { code: "TX", label: "Texas", value: "texas" },
  { code: "UT", label: "Utah", value: "utah" },
  { code: "VT", label: "Vermont", value: "vermont" },
  { code: "VA", label: "Virginia", value: "virginia" },
  { code: "WA", label: "Washington", value: "washington" },
  { code: "WV", label: "West Virginia", value: "west-virginia" },
  { code: "WI", label: "Wisconsin", value: "wisconsin" },
  { code: "WY", label: "Wyoming", value: "wyoming" },
];

interface LocationSelectProps {
  value: string;
  onChange: (value: State) => void;
}

export default function LocationSelect({
  value,
  onChange,
}: LocationSelectProps) {
  return (
    <Combobox
      onValueChange={(v) => {
        onChange(v ?? states[0]);
      }}
      value={states.find((state) => state.value === value) ?? states[0]}
      items={states}
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
      <ComboboxPopup aria-label="Select state">
        <div className="border-b p-2">
          <ComboboxInput
            size="sm"
            className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
            placeholder="e.g. Colorado"
            showTrigger={false}
            startAddon={<SearchIcon />}
          />
        </div>
        <ComboboxEmpty>No states found.</ComboboxEmpty>
        <ComboboxList>
          {(state: State) => (
            <ComboboxItem key={state.code} value={state.value}>
              {state.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
