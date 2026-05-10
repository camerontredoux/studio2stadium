import { toastManager } from "@/components/ui/toast-manager";
import { handleApiError, type ApiError } from "@/lib/api/errors";

/** Toast API errors from roster PATCH mutations (grid inline edit + detail sheet). */
export function toastRosterMutationError(err: unknown) {
  if (err instanceof TypeError) {
    toastManager.add({
      title: "Something went wrong. Check your connection.",
      type: "error",
    });
    return;
  }

  handleApiError({
    onValidation: (_field, message) => {
      toastManager.add({ title: message, type: "error" });
    },
    onError: (error) => {
      toastManager.add({
        title: error.message || "Request failed",
        type: "error",
      });
    },
  })(err as ApiError);
}
