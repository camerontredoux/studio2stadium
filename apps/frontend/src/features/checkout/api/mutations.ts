import { $api } from "@/lib/api/client";

export function useCheckout() {
  return $api.useMutation("post", "/subscriptions/checkout");
}

export function useDevGrant() {
  return $api.useMutation("post", "/subscriptions/dev-grant");
}
