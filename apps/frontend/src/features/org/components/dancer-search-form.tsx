import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { type DancerSearchForm as FormValues } from "@/features/org/api/scouting-schemas";
import { SearchIcon } from "lucide-react";

interface DancerSearchFormProps {
  schoolName: string | null;
  onSearchChange: (value: string) => void;
  onInterestedChange: (value: boolean) => void;
}

export function DancerSearchForm({
  schoolName,
  onSearchChange,
  onInterestedChange,
}: DancerSearchFormProps) {
  const { register, watch } = useForm<FormValues>({
    defaultValues: { search: "", interested: false },
  });

  const interested = watch("interested");

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          {...register("search", {
            onChange: (e) => onSearchChange(e.target.value),
          })}
          autoFocus
          placeholder="Search by name or bib #..."
          className="h-10 pl-9"
          inputMode="search"
        />
      </div>
      {schoolName && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={interested}
            onCheckedChange={(checked) => {
              onInterestedChange(!!checked);
            }}
          />
          Show only dancers interested in {schoolName}
        </label>
      )}
    </div>
  );
}
