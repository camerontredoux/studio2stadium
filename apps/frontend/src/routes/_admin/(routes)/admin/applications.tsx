import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { useApproveSchool } from "@/features/admin/api/mutations";
import { adminQueries } from "@/features/admin/api/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon } from "lucide-react";
import * as React from "react";

export const Route = createFileRoute("/_admin/(routes)/admin/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { data: applications } = useSuspenseQuery(adminQueries.applications());
  const { mutate: approve, isPending } = useApproveSchool();
  const [approvingId, setApprovingId] = React.useState<string | null>(null);

  const handleApprove = (id: string) => {
    setApprovingId(id);
    approve(
      { params: { path: { id } } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "School application approved",
            type: "success",
          });
          setApprovingId(null);
        },
        onError: () => {
          toastManager.add({
            title: "Error",
            description: "Failed to approve application",
            type: "error",
          });
          setApprovingId(null);
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
                    <Button
                      size="sm"
                      onClick={() => handleApprove(app.id)}
                      disabled={isPending}
                    >
                      {approvingId === app.id ? (
                        <Spinner label="Approving..." />
                      ) : (
                        <>
                          <CheckIcon className="mr-1 h-4 w-4" />
                          Approve
                        </>
                      )}
                    </Button>
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
