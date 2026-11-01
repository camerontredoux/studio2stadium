import { toastManager } from "@/components/ui/toast-manager";
import { toastApiError } from "@/lib/api/errors";
import { retryLoad } from "@/lib/retry-load";
import { useSession } from "@/lib/session";
import { StylesDialog } from "@/shared/styles/components/styles-dialog";
import { useQuery } from "@tanstack/react-query";
import { cloneElement } from "react";
import { useUpdateStyles } from "../../api/mutations";
import { dancerQueries } from "../../api/queries";

export function StylesList({ render }: { render: React.ReactElement }) {
  const session = useSession();

  const { data, isError, refetch } = useQuery(dancerQueries.styles());
  const { mutateAsync, isPending } = useUpdateStyles(session.username);

  const selectedStyleIds = (data ?? []).map((style) => style.styleId);

  const handleSave = async (styleIds: string[]) => {
    await mutateAsync(
      { body: { styles: styleIds } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Your styles have been updated",
            type: "success",
          });
        },
        onError: toastApiError,
      },
    );
  };

  // Until the saved selection loads, the dialog would open with nothing
  // selected and Save would overwrite it, so don't offer it yet. If the load
  // failed, the trigger retries it instead of staying disabled.
  if (!data) {
    return cloneElement(
      render as React.ReactElement<{
        disabled?: boolean;
        onClick?: () => void;
      }>,
      isError
        ? { onClick: () => retryLoad(refetch, "Error loading your styles") }
        : { disabled: true },
    );
  }

  return (
    <StylesDialog
      selectedStyleIds={selectedStyleIds}
      onSave={handleSave}
      isPending={isPending}
      render={render}
    />
  );
}
