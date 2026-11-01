import { Rating, RatingItem } from "@/components/ui/rating";

export function RatingInput({
  value,
  onChange,
  readOnly = false,
}: {
  value: number | null;
  onChange: (value: number) => void;
  readOnly?: boolean;
}) {
  const onSet = (n: number) => {
    navigator.vibrate?.(10);
    onChange(n);
  };

  return (
    <div className="flex items-center gap-1">
      <Rating value={value ?? 0} onValueChange={onSet} readOnly={readOnly}>
        {Array.from({ length: 5 }, (_, i) => (
          <RatingItem key={i} index={i} />
        ))}
      </Rating>
      {value != null && (
        <span className="text-muted-foreground ml-2 text-sm">{value}/5</span>
      )}
    </div>
  );
}
