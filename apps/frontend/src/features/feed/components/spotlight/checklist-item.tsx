import { CheckIcon, XIcon } from "lucide-react";

export function ChecklistItem({
  checked,
  label,
}: {
  checked: boolean;
  label: string;
}) {
  return (
    <>
      {checked ? (
        <CheckIcon className="text-brand size-4 shrink-0" />
      ) : (
        <XIcon className="text-destructive-foreground size-4 shrink-0" />
      )}
      <span>{label}</span>
    </>
  );
}
