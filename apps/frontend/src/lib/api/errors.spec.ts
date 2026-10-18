import { describe, expect, it, vi } from "vitest";

import { toastManager } from "@/components/ui/toast-manager";
import { toastApiError } from "./errors";

vi.mock("@/components/ui/toast-manager", () => ({
  toastManager: { add: vi.fn() },
}));

describe("toastApiError", () => {
  it("shows one toast for a validation error with several fields", () => {
    toastApiError({
      code: "E_VALIDATION_ERROR",
      status: 422,
      message: "Validation failed",
      errors: [
        { field: "name", message: "Name is required" },
        { field: "email", message: "Email is required" },
      ],
    });

    expect(toastManager.add).toHaveBeenCalledTimes(1);
    expect(toastManager.add).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Name is required" }),
    );
  });
});
