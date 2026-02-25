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
import { EditForm } from "./edit-form";

export function EditDialog({ username }: { username: string }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button size="xs" />}>Edit Profile</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your portfolio information here.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <EditForm username={username} />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="edit-profile-form">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
