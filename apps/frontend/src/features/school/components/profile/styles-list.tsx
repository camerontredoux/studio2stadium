import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError } from "@/lib/api/errors";
import { StylesDialog } from "@/shared/styles/components/styles-dialog";
import { useQuery } from "@tanstack/react-query";
import { useUpdateStyles } from "../../api/mutations";
import { schoolQueries } from "../../api/queries";

export function StylesList({
  render,
  username,
}: {
  render: React.ReactElement;
  username?: string;
}) {
  const { data } = useQuery(schoolQueries.styles());
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
