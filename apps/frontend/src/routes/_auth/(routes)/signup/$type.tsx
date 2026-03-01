import { accountTypeSchema, schemas } from "@/features/signup/api/schemas";
import { SignupForm } from "@/features/signup/components/signup-form";
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
  beforeLoad: ({ search, params }) => {
    if (!search.username) {
      throw redirect({ to: "/signup" });
    }
    if (params.type === "school" && !search.schoolName) {
      throw redirect({ to: "/signup" });
    }
  },
  component: SignupForm,
});
