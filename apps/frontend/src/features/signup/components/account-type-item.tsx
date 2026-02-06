import { FramePanel } from "@/components/ui/frame";
import { Label } from "@/components/ui/label";
import { Radio } from "@/components/ui/radio-group";

interface AccountTypeItemProps {
  value: string;
  title: string;
  description: string;
}

export function AccountTypeItem({
  value,
  title,
  description,
}: AccountTypeItemProps) {
  return (
    <FramePanel className="p-0!">
      <Label className="hover:bg-accent/50 flex items-start gap-2 p-3">
        <Radio value={value} />
        <div className="flex flex-col gap-1">
          <p>{title}</p>
          <p className="text-muted-foreground text-xs font-light">
            {description}
          </p>
        </div>
      </Label>
    </FramePanel>
  );
}
