import { Textarea } from "@/components/ui/textarea";

export function NotesEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your private notes on this dancer…"
      className="min-h-32 flex-1"
      maxLength={5000}
    />
  );
}
