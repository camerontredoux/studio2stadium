import { FavoritesPage } from "@/features/favorites/page";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources/favorites")({
  beforeLoad: ({ context: { session } }) => {
    if (session.type === "dancer") {
      throw redirect({ to: "/resources/library" });
    }
  },
  component: FavoritesPage,
});
