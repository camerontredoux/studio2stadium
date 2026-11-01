import { toastManager } from "@/components/ui/toast-manager";
import { toastApiError } from "@/lib/api/errors";
import { retryLoad } from "@/lib/retry-load";
import { SportsDialog } from "@/shared/sports/components/sports-dialog";
import { useQuery } from "@tanstack/react-query";
import { cloneElement } from "react";
import { useUpdateSports } from "../../api/mutations";
import { schoolQueries } from "../../api/queries";

export function SportsList({
  render,
  username,
}: {
  render: React.ReactElement;
  username?: string;
}) {
  const { data, isError, refetch } = useQuery(schoolQueries.sports());
  const { mutateAsync, isPending } = useUpdateSports(username);

  const selectedSportIds = (data ?? []).map((sport) => sport.sportId);

  const handleSave = async (sportIds: string[]) => {
    await mutateAsync(
      { body: { sports: sportIds } },
      {
        onSuccess: () => {
          toastManager.add({
            title: "Success",
            description: "Your sports have been updated",
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
        ? { onClick: () => retryLoad(refetch, "Error loading your sports") }
        : { disabled: true },
    );
  }

  return (
    <SportsDialog
      selectedSportIds={selectedSportIds}
      onSave={handleSave}
      isPending={isPending}
      render={render}
    />
  );
}
