import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface Month {
  label: string;
  value: number;
}

const months: Month[] = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

interface MonthSelectProps {
  value: number;
  onChange: (value: number | null) => void;
}

export function MonthSelect({ value, onChange }: MonthSelectProps) {
  return (
    <Select value={value ?? ""} onValueChange={onChange} items={months}>
      <SelectTrigger>
        <SelectValue placeholder="Month" />
      </SelectTrigger>
      <SelectContent className="max-h-60" alignItemWithTrigger={false}>
        {months.map((month) => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
