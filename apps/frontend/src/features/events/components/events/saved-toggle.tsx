import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SavedToggle({
  onChange,
}: {
  onChange: (value: boolean) => void;
}) {
  return (
    <Label className="text-muted-foreground">
      Saved
      <Switch onCheckedChange={onChange} />
    </Label>
  );
}
