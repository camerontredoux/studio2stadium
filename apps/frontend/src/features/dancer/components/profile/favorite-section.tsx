import { useQuery } from "@tanstack/react-query";
import { dancerQueries } from "../../api/queries";
import { type DancerProfile } from "../../types";
import { FavoriteButton } from "./favorite-button";

export function FavoriteSection({ dancer }: { dancer: DancerProfile }) {
  const { data } = useQuery(dancerQueries.metadata(dancer.id));

  return (
    <div>
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      <FavoriteButton dancerId={dancer.id} />
    </div>
  );
}
