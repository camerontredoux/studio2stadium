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
import { US_STATES, CA_PROVINCES } from "@/utils/constants/states";

interface State {
  value: string | null;
  label: string;
}

// Built from the shared region source so the picker options and the display
// lookups can't drift. Canadian provinces are suffixed for clarity; the stored
// value is still the bare 2-letter code.
const states: State[] = [
  { label: "Select location", value: null },
  ...Object.entries(US_STATES).map(([value, label]) => ({ value, label })),
  ...Object.entries(CA_PROVINCES).map(([value, label]) => ({
    value,
    label: `${label} (Canada)`,
  })),
];

/** Normalize `items` entries (State objects) and the controlled `value` (state code string). */
function locationItemEquals(a: unknown, b: unknown): boolean {
  const code = (x: unknown) =>
    x != null && typeof x === "object" && "value" in (x as object)
      ? (x as State).value
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
  // Item values are `state.value` (string | null). Root `value` must use the same
  // shape so Base UI can match selection (Object.is is the default comparator).
  const selectedCode =
    value && states.some((s) => s.value === value) ? value : null;

  return (
    <Combobox
      onValueChange={(v) => {
        onChange((v as string) ?? "");
      }}
      value={selectedCode}
      items={states}
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
            <ComboboxItem
              key={state.value ?? "__placeholder__"}
              value={state.value}
            >
              {state.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
