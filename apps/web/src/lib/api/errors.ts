import type { components } from "./types";

export type ApiSchemas = components["schemas"];

export type ApiError = ApiSchemas["ApiError"];

export function handleApiErrors(
  errors: ApiError[],
  handlers: {
    onRateLimit?: (retryAfter: number) => void;
    onValidation?: (field: string, message: string) => void;
    onError?: (message: string) => void;
  },
) {
  for (const e of errors ?? []) {
    if (e.meta?.retryAfter && handlers.onRateLimit) {
      handlers.onRateLimit(e.meta.retryAfter);
      return;
    }

    if (e.meta?.field && handlers.onValidation) {
      handlers.onValidation(e.meta.field, e.message);
      continue;
    }

    if (handlers.onError) {
      handlers.onError(e.message);
    }
  }
}
