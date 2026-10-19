import { toastManager } from "@/components/ui/toast-manager";

// Refetches a query that failed to load, and tells the user if it fails again.
export async function retryLoad(
  refetch: () => Promise<{ isError: boolean }>,
  title: string,
) {
  const { isError } = await refetch();
  if (isError) {
    toastManager.add({
      title,
      description: "Something went wrong. Try again.",
      type: "error",
    });
  }
}
