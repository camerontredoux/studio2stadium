import { $api } from "@/lib/api/client";

export function useCheckout() {
  return $api.useMutation("post", "/dancers/checkout");
}
