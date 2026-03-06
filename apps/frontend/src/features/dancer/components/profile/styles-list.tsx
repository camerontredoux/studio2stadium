import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { useSession } from "@/lib/session";
import { StylesDialog } from "@/shared/styles/components/styles-dialog";
import { useQuery } from "@tanstack/react-query";
import { useUpdateStyles } from "../../api/mutations";
import { dancerQueries } from "../../api/queries";

export function StylesList({ render }: { render: React.ReactElement }) {
  const session = useSession();

  const { data } = useQuery(dancerQueries.styles());
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
    <StylesDialog
      selectedStyleIds={selectedStyleIds}
      onSave={handleSave}
      isPending={isPending}
      render={render}
    />
  );
}
