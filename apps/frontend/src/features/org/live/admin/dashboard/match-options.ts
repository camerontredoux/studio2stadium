type MatchDancer = {
  id: string;
  firstName: string;
  lastName: string;
  bibNumber: number | null;
  email?: string | null;
  isRegistered: boolean;
};

type MatchOptionGroup = {
  group: string;
  options: { value: string; label: string }[];
};

/** The groups in the shape the `Combobox` takes: option ids per group. */
export function comboboxGroups(groups: readonly MatchOptionGroup[]) {
  return groups.map(({ group, options }) => ({
    group,
    options: options.map((option) => option.value),
  }));
}

function normalize(name: string) {
  return name.trim().toLowerCase();
}

/**
 * "125 · Jason Jones · jason@example.com · already claimed". The bib, email and
 * claimed marker are left out when the dancer has none. The picker searches this
 * text, so a name or an email finds the row.
 */
export function dancerOptionLabel(dancer: MatchDancer) {
  const name = `${dancer.firstName} ${dancer.lastName}`.trim();
  return [
    dancer.bibNumber == null ? null : String(dancer.bibNumber),
    name,
    dancer.email || null,
    dancer.isRegistered ? "already claimed" : null,
  ]
    .filter(Boolean)
    .join(" · ");
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
