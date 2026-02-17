import { useQuery } from "@tanstack/react-query";
import { dancerQueries } from "../../api/queries";
import { FavoriteButton } from "./favorite-button";

export function FavoriteSection({ id }: { id: string }) {
  const { data } = useQuery(dancerQueries.metadata(id));

  const isFavorited = data?.favorited ?? false;

  return (
    <div>
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      <FavoriteButton id={id} isFavorited={isFavorited} />
    </div>
  );
}
