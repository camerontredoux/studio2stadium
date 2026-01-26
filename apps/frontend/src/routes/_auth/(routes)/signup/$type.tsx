import { SignupForm } from "@/features/signup/components/signup-form";
import { accountTypeSchema, schemas } from "@/features/signup/schemas";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/signup/$type")({
  validateSearch: schemas.search,
  params: {
    parse: ({ type }) => {
      const result = accountTypeSchema.safeParse(type);
      if (!result.success) {
        throw redirect({ to: "/signup" });
      }

      return { type: result.data };
    },
    stringify: ({ type }) => ({ type }),
  },
  beforeLoad: ({ search }) => {
    if (!search.username) {
      throw redirect({ to: "/signup" });
    }
  },
  component: SignupForm,
});
