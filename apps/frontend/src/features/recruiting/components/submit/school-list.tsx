import { useSuspenseQuery } from "@tanstack/react-query";
import { recruitingQueries } from "../../api/queries";

export function SchoolList() {
  const { data } = useSuspenseQuery(recruitingQueries.schools());

  return (
    <div>
      {data.map((school) => (
        <div key={school.id}>
          <h3>{school.name}</h3>
          <p>{school.location}</p>
        </div>
      ))}
    </div>
  );
}
