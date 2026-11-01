import { toastManager } from "@/components/ui/toast-manager";
import type { ApiSchemas } from "./client";

export type ApiError = ApiSchemas["Error"];

export const handleApiError =
  (handlers: {
    onRateLimit?: (retryAfter: number) => void;
    onValidation?: (field: string, message: string) => void;
    onError?: (error: ApiError) => void;
  }) =>
  (error: ApiError) => {
    if (error instanceof TypeError) {
      return;
    }

    if (error.retryAfter && handlers.onRateLimit) {
      handlers.onRateLimit(error.retryAfter);
      return;
    }

    if (error.errors && handlers.onValidation) {
      for (const e of error.errors) {
        handlers.onValidation(e.field, e.message);
      }
      return;
    }

    if (handlers.onError) {
      handlers.onError(error);
    }
  };

// One error toast per failed request: a validation response shows its first
// field message instead of stacking a toast for every field.
export const toastApiError = handleApiError({
  onError: (error) => {
    toastManager.add({
      title: "Error",
      description: error.errors?.[0]?.message ?? error.message,
      type: "error",
    });
  },
});
