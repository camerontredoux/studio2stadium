import { Button } from "@/components/event/button";
import { TimezoneCombobox } from "@/features/org/live/shared/timezone-combobox";

type TimezonePickerProps = {
  id?: string;
  value: string;
  /** Called with the chosen IANA name, or "" to clear the default. */
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-describedby"?: string;
};

/** The default timezone field: a searchable timezone list and, once one is set, a Clear default button. */
function TimezonePicker({
  id,
  value,
  onChange,
  disabled,
  "aria-describedby": describedBy,
}: TimezonePickerProps) {
  return (
    <div className="flex w-full max-w-[360px] min-w-0 items-center gap-(--space-8)">
      <TimezoneCombobox
        id={id}
        aria-describedby={describedBy}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder="No default set"
        className="flex-1"
      />
      {value && (
        <Button
          variant="ghost"
          disabled={disabled}
          onClick={() => onChange("")}
          className="shrink-0"
        >
          Clear default
        </Button>
      )}
    </div>
  );
}

export { TimezonePicker };
export type { TimezonePickerProps };
