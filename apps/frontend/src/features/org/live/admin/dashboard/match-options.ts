type MatchDancer = {
  id: string;
  firstName: string;
  lastName: string;
  bibNumber: number | null;
  isRegistered: boolean;
};

type MatchOptionGroup = {
  group: string;
  options: { value: string; label: string }[];
};

function normalize(name: string) {
  return name.trim().toLowerCase();
}

/** "125 · Jason Jones", or just the name when the dancer has no bib. */
export function dancerOptionLabel(dancer: MatchDancer) {
  const name = `${dancer.firstName} ${dancer.lastName}`.trim();
  return dancer.bibNumber == null ? name : `${dancer.bibNumber} · ${name}`;
}

/**
 * The Match dialog's dancer options: rows whose name matches the name the
 * dancer gave come first, then "Not activated", then "Active" (the mockup's
 * groups). Empty groups are left out.
 */
export function matchOptionGroups(
  dancers: readonly MatchDancer[],
  claimed: { firstName: string; lastName: string },
): MatchOptionGroup[] {
  const first = normalize(claimed.firstName);
  const last = normalize(claimed.lastName);
  const matches: MatchDancer[] = [];
  const pending: MatchDancer[] = [];
  const active: MatchDancer[] = [];
  for (const dancer of dancers) {
    if (
      last !== "" &&
      normalize(dancer.lastName) === last &&
      (first === "" || normalize(dancer.firstName) === first)
    ) {
      matches.push(dancer);
    } else if (dancer.isRegistered) {
      active.push(dancer);
    } else {
      pending.push(dancer);
    }
  }
  const toOptions = (rows: MatchDancer[]) =>
    rows.map((dancer) => ({
      value: dancer.id,
      label: dancerOptionLabel(dancer),
    }));
  return [
    { group: "Name matches", options: toOptions(matches) },
    { group: "Not activated", options: toOptions(pending) },
    { group: "Active", options: toOptions(active) },
  ].filter((group) => group.options.length > 0);
}

/** The single name match, if there is exactly one, to preselect. */
export function soleNameMatch(groups: readonly MatchOptionGroup[]) {
  const matches = groups.find((group) => group.group === "Name matches");
  return matches?.options.length === 1 ? matches.options[0].value : null;
}
