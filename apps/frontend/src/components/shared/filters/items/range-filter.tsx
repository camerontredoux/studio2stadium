import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Slider } from "@/components/ui/slider";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import type { OnFilterChange } from "../filter-item";
import type { FilterValue } from "../types";

interface RangeFilterProps {
  value: FilterValue;
  onFilterChange: OnFilterChange;
}

const MIN = 0;
const MAX = 4;
const STEP = 0.1;
const STEP_DECIMALS = 1;

// Slider steps add in floating point (0.1 + 0.2 = 0.30000000000000004), so
// round to the step's precision before the value reaches state or the URL.
const roundToStep = (v: number) => Number(v.toFixed(STEP_DECIMALS));

export function RangeFilter({ value, onFilterChange }: RangeFilterProps) {
  const param = Array.isArray(value) ? value : value?.split(",");
  const raw = param?.map(Number) ?? [MIN, MAX];

  const clamp = (val: number | undefined, fallback: number) =>
    Math.min(Math.max(val || fallback, MIN), MAX);

  const fromUrl = () => [clamp(raw[0], MIN), clamp(raw[1], MAX)];
  const [values, setValues] = useState(fromUrl);
  const [urlValue, setUrlValue] = useState(value);

  // Follow the URL when it changes, such as Clear Filters or Back.
  if (String(value) !== String(urlValue)) {
    setUrlValue(value);
    setValues(fromUrl());
  }

  const handleFilter = () => {
    onFilterChange(`${values[0]},${values[1]}`);
  };

  const updateValue = (index: number, newValue: number | null) => {
    const v = roundToStep(newValue ?? MIN);
    setValues((prev) => {
      const next = [...prev];
      if (index === 0) {
        next[0] = Math.min(v, prev[1] ?? MAX);
      } else {
        next[1] = Math.max(v, prev[0] ?? MIN);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <NumberField
          aria-label="Minimum value"
          className="w-20"
          max={values[1]}
          min={MIN}
          onValueChange={(v) => updateValue(0, v)}
          render={<NumberFieldGroup />}
          size="sm"
          value={values[0]}
        >
          <NumberFieldInput />
        </NumberField>
        <Slider
          aria-label="Dual range slider"
          className="flex-1 *:min-w-0!"
          thumbCollisionBehavior="none"
          max={MAX}
          min={MIN}
          step={STEP}
          onValueChange={(v) =>
            setValues((Array.isArray(v) ? [...v] : [v]).map(roundToStep))
          }
          value={values}
        />
        <NumberField
          aria-label="Maximum value"
          className="w-20"
          max={MAX}
          min={values[0]}
          onValueChange={(v) => updateValue(1, v)}
          render={<NumberFieldGroup />}
          size="sm"
          value={values[1]}
        >
          <NumberFieldInput />
        </NumberField>
      </div>

      <Button
        disabled={values[0] === raw[0] && values[1] === raw[1]}
        className="w-full"
        size="sm"
        variant="outline"
        onClick={handleFilter}
      >
        <CheckIcon />
      </Button>
    </div>
  );
}
