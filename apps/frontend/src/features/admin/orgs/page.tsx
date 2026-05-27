import { toastManager } from "@/components/ui/toast-manager";
import { useDeleteOrg } from "@/features/admin/api/mutations";
import { adminQueries } from "@/features/admin/api/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { CreateOrgDialog } from "./components/create-org-dialog";
import { EditOrgDialog } from "./components/edit-org-dialog";
import { MembersDialog } from "./components/members-dialog";
import { OrgsTable } from "./components/orgs-table";

interface Org {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  features: Record<string, unknown>;
  settings: Record<string, unknown>;
  createdAt: string;
  memberCount: number;
  eventCount: number;
  activeEvent: string | null;
}

export function OrgsPage() {
  const { data: orgs } = useSuspenseQuery(adminQueries.orgs());
  const { mutate: deleteOrg, isPending: isDeleting } = useDeleteOrg();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Org | null>(null);
  const [membersOrg, setMembersOrg] = useState<Org | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Org | null>(null);

  const handleDelete = () => {
    if (!deletingOrg) return;
    deleteOrg(
      { params: { path: { id: deletingOrg.id } } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Organization deleted",
            description: `${deletingOrg.name} has been permanently deleted`,
            type: "success",
          });
          setDeletingOrg(null);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to delete organization",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Organizations</h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create
        </Button>
      </div>

      <OrgsTable
        orgs={(orgs ?? []) as Org[]}
        onEdit={setEditingOrg}
        onDelete={setDeletingOrg}
        onManageMembers={setMembersOrg}
      />

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />

      <EditOrgDialog
        org={editingOrg}
        onOpenChange={(open) => !open && setEditingOrg(null)}
      />

      <MembersDialog
        org={membersOrg}
        onOpenChange={(open) => !open && setMembersOrg(null)}
      />

      <AlertDialog
        open={!!deletingOrg}
        onOpenChange={(open) => !open && setDeletingOrg(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingOrg?.name}</strong>{" "}
              and all associated events, rosters, and memberships. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" />}
            >
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Organization"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
