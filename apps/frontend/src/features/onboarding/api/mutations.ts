import { $api } from "@/lib/api/client";
import { queries } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export const useCreateDancer = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return $api.useMutation("post", "/dancers", {
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: ["session"] });
      const session = await queryClient.fetchQuery(queries.session());
      if (session?.orgMemberships?.length) {
        const sub = await queryClient.fetchQuery(queries.subscribed(true));
        if (sub?.subscribed) {
          const org = session.orgMemberships[0];
          navigate({ to: `/o/${org.orgSlug}`, replace: true });
          return;
        }
      }
      navigate({ to: "/checkout", replace: true });
    },
  });
};

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return $api.useMutation("post", "/application", {
    onSuccess: async () => {
      await queryClient.resetQueries({ queryKey: ["application"] });
      navigate({ to: "/settings/application", replace: true });
    },
  });
};
