import { toastManager } from "@/components/ui/toast-manager";
import type { ApiSchemas } from "@/lib/api/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useUpdateApplicationStatus } from "../api/mutations";
import { adminQueries } from "../api/queries";
import { ApplicationsTable } from "./components/applications-table";
import { type PendingAction, StatusDialog } from "./components/status-dialog";

type Application = ApiSchemas["AdminApplicationsResponse"][number];

export function ApplicationsPage() {
  const { data: applications } = useSuspenseQuery(adminQueries.applications());
  const { mutate: updateStatus, isPending } = useUpdateApplicationStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const handleConfirm = (notes?: string) => {
    if (!pendingAction) return;

    updateStatus(
      {
        params: { path: { id: pendingAction.id } },
        body: {
          status: pendingAction.status,
          notes,
        },
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description:
              pendingAction.status === "accepted"
                ? "School application approved"
                : "School application rejected",
            type: "success",
          });
          setDialogOpen(false);
          setPendingAction(null);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: `Failed to ${pendingAction.status === "accepted" ? "approve" : "reject"} application`,
            type: "error",
          });
        },
      },
    );
  };

  const openDialog = (app: Application, status: "accepted" | "rejected") => {
    setPendingAction({
      id: app.id,
      status,
      schoolName: app.school.name,
      thumbnail: app.thumbnail,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">School Applications</h2>

      <ApplicationsTable
        applications={applications}
        onApprove={(app) => openDialog(app, "accepted")}
        onReject={(app) => openDialog(app, "rejected")}
      />

      <StatusDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pendingAction={pendingAction}
        isPending={isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
