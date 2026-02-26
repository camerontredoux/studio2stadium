import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Suspense, useState } from "react";
import { StylesList } from "./styles-list";

interface StylesDialogProps {
  selectedStyleIds: string[];
  onSave: (styleIds: string[]) => Promise<void>;
  isPending?: boolean;
  render: React.ReactElement;
}

function StylesDialogContentFallbackItem() {
  const [width] = useState(() => Math.floor(Math.random() * 80) + 50);
  return (
    <Skeleton
      style={{ width: `${width}px` }}
      className={`h-9 rounded-full sm:h-8`}
    />
  );
}
function StylesDialogContentFallback() {
  return (
    <DialogPanel className="h-full">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 15 }).map((_, index) => {
          return <StylesDialogContentFallbackItem key={index} />;
        })}
      </div>
    </DialogPanel>
  );
}

export function StylesDialog({
  selectedStyleIds,
  onSave,
  isPending,
  render,
}: StylesDialogProps) {
  const [open, setOpen] = useState(false);
  const [localSelectedStyleIds, setLocalSelectedStyleIds] =
    useState<string[]>(selectedStyleIds);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocalSelectedStyleIds(selectedStyleIds);
    }
    setOpen(nextOpen);
  };

  const handleToggle = (styleId: string) => {
    setLocalSelectedStyleIds((prev) =>
      prev.includes(styleId)
        ? prev.filter((id) => id !== styleId)
        : [...prev, styleId],
    );
  };

  const handleSave = async () => {
    await onSave(localSelectedStyleIds);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger nativeButton={false} render={render} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dance Styles</DialogTitle>
          <DialogDescription>
            Select your top 3 styles to help us recommend the right programs
          </DialogDescription>
        </DialogHeader>
        <Suspense fallback={<StylesDialogContentFallback />}>
          <DialogPanel className="h-full">
            <StylesList
              onToggle={handleToggle}
              selectedStyleIds={localSelectedStyleIds}
            />
          </DialogPanel>
        </Suspense>

        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Spinner label="Saving..." /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
