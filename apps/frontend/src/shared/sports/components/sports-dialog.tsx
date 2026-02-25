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
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { SportsList } from "./sports-list";

interface SportsDialogProps {
  selectedSportIds: string[];
  onSave: (sportIds: string[]) => Promise<void>;
  isPending?: boolean;
  render: React.ReactElement;
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
        <DialogPanel className="h-full">
          <SportsList
            onToggle={handleToggle}
            selectedSportIds={localSelectedSportIds}
          />
        </DialogPanel>

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
