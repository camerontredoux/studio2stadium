import { toastManager } from "@/components/ui/toast-manager";
import { toastApiError } from "@/lib/api/errors";
import { retryLoad } from "@/lib/retry-load";
import { StylesDialog } from "@/shared/styles/components/styles-dialog";
import { useQuery } from "@tanstack/react-query";
import { cloneElement } from "react";
import { useUpdateStyles } from "../../api/mutations";
import { schoolQueries } from "../../api/queries";

export function StylesList({
  render,
  username,
}: {
  render: React.ReactElement;
  username?: string;
}) {
  const { data, isError, refetch } = useQuery(schoolQueries.styles());
  const { mutateAsync, isPending } = useUpdateStyles(username);

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
