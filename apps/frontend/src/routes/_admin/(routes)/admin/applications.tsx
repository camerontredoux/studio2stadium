import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useUpdateApplicationStatus } from "@/features/admin/api/mutations";
import { adminQueries } from "@/features/admin/api/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, XIcon } from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/_admin/(routes)/admin/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { data: applications } = useSuspenseQuery(adminQueries.applications());
  const { mutate: updateStatus, isPending } = useUpdateApplicationStatus();
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [processingAction, setProcessingAction] = React.useState<"accepted" | "rejected" | null>(null);

  const handleUpdateStatus = (id: string, status: "accepted" | "rejected") => {
    setProcessingId(id);
    setProcessingAction(status);
    updateStatus(
      { params: { path: { id } }, body: { status } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: status === "accepted" ? "School application approved" : "School application rejected",
            type: "success",
          });
          setProcessingId(null);
          setProcessingAction(null);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: `Failed to ${status === "accepted" ? "approve" : "reject"} application`,
            type: "error",
          });
          setProcessingId(null);
          setProcessingAction(null);
        },
      },
    );
  };

  const pendingApplications = applications.filter(
    (app) => app.status === "pending",
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">School Applications</h2>

      {pendingApplications.length === 0 ? (
        <p className="text-muted-foreground">No pending applications</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">School</th>
                <th className="p-3 text-left text-sm font-medium">Email</th>
                <th className="p-3 text-left text-sm font-medium">Location</th>
                <th className="p-3 text-left text-sm font-medium">
                  Submitted
                </th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApplications.map((app) => (
                <tr key={app.id} className="border-b">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={app.thumbnail ?? undefined} />
                        <AvatarFallback>{app.school.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{app.school.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {app.school.user.firstName} {app.school.user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{app.school.user.email}</td>
                  <td className="p-3 text-sm">{app.school.location}</td>
                  <td className="p-3 text-sm">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(app.id, "accepted")}
                        disabled={isPending}
                      >
                        {processingId === app.id && processingAction === "accepted" ? (
                          <Spinner label="Approving..." />
                        ) : (
                          <>
                            <CheckIcon className="mr-1 h-4 w-4" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(app.id, "rejected")}
                        disabled={isPending}
                      >
                        {processingId === app.id && processingAction === "rejected" ? (
                          <Spinner label="Rejecting..." />
                        ) : (
                          <>
                            <XIcon className="mr-1 h-4 w-4" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
