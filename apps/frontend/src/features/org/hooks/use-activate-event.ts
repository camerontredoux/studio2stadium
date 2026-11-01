import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toastManager } from "@/components/ui/toast-manager";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { client } from "@/lib/api/client";

/**
 * Make an Org Event the Org's active event — the one its dancers and coaches
 * see. The backend stands the previous active event down.
 */
export function useActivateEvent(
  orgSlug: string,
  { onSuccess }: { onSuccess?: () => void } = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const raw = client as unknown as {
        PATCH: (
          path: string,
          options: { body: { isActive: boolean } },
        ) => Promise<{ data: OrgEvent; error?: { message?: string } }>;
      };
      const response = await raw.PATCH(`/orgs/${orgSlug}/events/${eventId}`, {
        body: { isActive: true },
      });
      // Surfaces the backend's reason, e.g. an event stood down after its
      // purchase was refunded or disputed (#91).
      if (response.error) {
        throw new Error(response.error.message ?? "Activation failed");
      }
      return response.data;
    },
    onSuccess: () => {
      onSuccess?.();
      void queryClient.invalidateQueries(adminQueries.events(orgSlug));
      toastManager.add({ title: "Active event updated", type: "success" });
    },
    onError: (err) => {
      toastManager.add({
        title: "Couldn't make event active",
        description: err.message,
        type: "error",
      });
    },
  });
}
