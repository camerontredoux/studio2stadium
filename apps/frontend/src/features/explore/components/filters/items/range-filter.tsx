import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Slider } from "@/components/ui/slider";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { CheckIcon } from "lucide-react";
import { useState } from "react";

interface RangeFilterProps {
  paramKey: string;
}

const min = 0;
const max = 5;

export function RangeFilter({ paramKey }: RangeFilterProps) {
  const filters = useSearch({ from: "/_app/(routes)/explore" });
  const navigate = useNavigate({ from: "/explore" });

  const raw = [filters[paramKey]].flat()[0]?.split(",").map(Number) ?? [
    min,
    max,
  ];

  const clamp = (val: number | undefined, fallback: number) =>
    Math.min(Math.max(val ?? fallback, min), max);

  const [values, setValues] = useState([
    clamp(raw[0] || min, min),
    clamp(raw[1] || max, max),
  ]);

  const handleFilter = () => {
    navigate({
      search: (prev) => {
        return {
          ...prev,
          [paramKey]: `${values[0]},${values[1]}`,
        };
      },
    });
  };

  const updateValue = (index: number, newValue: number | null) => {
    const v = newValue ?? min;
    setValues((prev) => {
      const next = [...prev];
      if (index === 0) {
        // Min value: clamp to not exceed max value
        next[0] = Math.min(v, prev[1] ?? max);
      } else {
        // Max value: clamp to not go below min value
        next[1] = Math.max(v, prev[0] ?? min);
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
          min={min}
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
          max={max}
          min={min}
          step={0.1}
          onValueChange={(v) => setValues(Array.isArray(v) ? [...v] : [v])}
          value={values}
        />
        <NumberField
          aria-label="Maximum value"
          className="w-20"
          max={max}
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
