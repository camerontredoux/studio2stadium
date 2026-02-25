import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { SportsDialog } from "@/shared/sports/components/sports-dialog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useUpdateSports } from "../../api/mutations";
import { dancerQueries } from "../../api/queries";

export function SportsList({
  render,
  username,
}: {
  render: React.ReactElement;
  username?: string;
}) {
  const { data } = useSuspenseQuery(dancerQueries.sports());
  const { mutateAsync, isPending } = useUpdateSports(username);

  const selectedSportIds = data.map((sport) => sport.sportId);

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
        onError: handleApiError({
          onError: (error) => {
            toastManager.add({
              title: "Error",
              description: error.message,
              type: "error",
            });
          },
          onValidation: (_, message) => {
            toastManager.add({
              title: "Error",
              description: message,
              type: "error",
            });
          },
        }),
      },
    );
  };

  return (
    <SportsDialog
      selectedSportIds={selectedSportIds}
      onSave={handleSave}
      isPending={isPending}
      render={render}
    />
  );
}
