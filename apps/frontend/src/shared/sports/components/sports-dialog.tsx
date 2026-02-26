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
import { SportsList } from "./sports-list";

interface SportsDialogProps {
  selectedSportIds: string[];
  onSave: (sportIds: string[]) => Promise<void>;
  isPending?: boolean;
  render: React.ReactElement;
}

function SportsDialogContentFallbackItem() {
  const [width] = useState(() => Math.floor(Math.random() * 80) + 50);
  return (
    <Skeleton
      style={{ width: `${width}px` }}
      className={`h-9 rounded-full sm:h-8`}
    />
  );
}

function SportsDialogContentFallback() {
  return (
    <DialogPanel className="h-full">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 15 }).map((_, index) => {
          return <SportsDialogContentFallbackItem key={index} />;
        })}
      </div>
    </DialogPanel>
  );
}

export function SportsDialog({
  selectedSportIds,
  onSave,
  isPending,
  render,
}: SportsDialogProps) {
  const [open, setOpen] = useState(false);
  const [localSelectedSportIds, setLocalSelectedSportIds] =
    useState<string[]>(selectedSportIds);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setLocalSelectedSportIds(selectedSportIds);
    }
    setOpen(nextOpen);
  };

  const handleToggle = (sportId: string) => {
    setLocalSelectedSportIds((prev) =>
      prev.includes(sportId)
        ? prev.filter((id) => id !== sportId)
        : [...prev, sportId],
    );
  };

  const handleSave = async () => {
    await onSave(localSelectedSportIds);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger nativeButton={false} render={render} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sports</DialogTitle>
          <DialogDescription>
            Select the sports you are most interested in supporting
          </DialogDescription>
        </DialogHeader>
        <Suspense fallback={<SportsDialogContentFallback />}>
          <DialogPanel className="h-full">
            <SportsList
              onToggle={handleToggle}
              selectedSportIds={localSelectedSportIds}
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
