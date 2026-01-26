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
