import { DownloadIcon, MailIcon, Trash2Icon } from "lucide-react";
import type { BulkAction } from "./data-grid";

export function rosterBulkActions({
  onExport,
  onResendInvite,
  onDelete,
}: {
  onExport?: (ids: string[]) => void | Promise<void>;
  onResendInvite?: (ids: string[]) => void | Promise<void>;
  onDelete?: (ids: string[]) => void | Promise<void>;
}): BulkAction[] {
  const actions: BulkAction[] = [];
  if (onExport) {
    actions.push({
      id: "export",
      label: "Export selection",
      icon: <DownloadIcon className="size-3" />,
      onClick: onExport,
    });
  }
  if (onResendInvite) {
    actions.push({
      id: "resend-invite",
      label: "Resend invite",
      icon: <MailIcon className="size-3" />,
      onClick: onResendInvite,
    });
  }
  if (onDelete) {
    actions.push({
      id: "delete",
      label: "Delete",
      icon: <Trash2Icon className="size-3" />,
      variant: "destructive",
      onClick: onDelete,
    });
  }
  return actions;
}
