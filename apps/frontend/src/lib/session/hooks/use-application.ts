import { useSuspenseQuery } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { sessionQueries } from "../queries";

/**
 * Hook to get the school's application.
 * @returns School's application or throws an error if the application is not found.
 */
export function useApplication() {
  const { data } = useSuspenseQuery(sessionQueries.application());

  if (!data) {
    throw redirect({
      to: "/onboarding",
      replace: true,
    });
  }

  return data;
}
