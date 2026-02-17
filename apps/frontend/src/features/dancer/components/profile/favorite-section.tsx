import { useQuery } from "@tanstack/react-query";
import { dancerQueries } from "../../api/queries";
import { type FavoritedDancer } from "@/shared/types";
import { type DancerProfile } from "../../types";
import { FavoriteButton } from "./favorite-button";

export function FavoriteSection({ dancer }: { dancer: DancerProfile }) {
  const { data } = useQuery(dancerQueries.metadata(dancer.id));

  const isFavorited = data?.favorited ?? false;

  const favoritedDancer: FavoritedDancer = {
    id: dancer.id,
    username: dancer.username,
    avatar: dancer.avatar,
    name: dancer.username,
  };

  return (
    <div>
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      <FavoriteButton dancer={favoritedDancer} isFavorited={isFavorited} />
    </div>
  );
}
