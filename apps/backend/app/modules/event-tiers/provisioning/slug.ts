import { randomBytes } from "node:crypto";

/** `organizations.slug` is `varchar(64)`. */
const MAX_LENGTH = 64;

/** What an Org whose name has no URL-safe characters at all is called. */
const FALLBACK = "org";

/**
 * How many numbered variants to offer before giving up on readable ones. Ten is
 * about as far as "summit-9" stays something a person would recognise; past that
 * a random suffix is both shorter and more honest.
 */
const NUMBERED_VARIANTS = 9;

const trimDashes = (value: string) => value.replace(/^-+|-+$/g, "");

/**
 * The URL an Org is reached at, derived from the name its Organizer typed.
 *
 * An Organizer buys an event; they should not have to know what a slug is, so
 * the name they gave is all we ask for and this turns it into `/o/{slug}`.
 */
export function deriveOrgSlug(name: string): string {
  const ascii = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  return trimDashes(trimDashes(ascii).slice(0, MAX_LENGTH)) || FALLBACK;
}

/**
 * Slugs to try for a new Org, best first.
 *
 * Two Orgs may legitimately be called the same thing, and the second one's
 * purchase has already been paid for by the time we find out — so a taken slug
 * has to produce a usable Org rather than a failed provision. The suffixes are
 * appended within the column's length, so a name at the limit loses its tail
 * rather than the digits that make it unique.
 */
export function orgSlugCandidates(name: string): string[] {
  const base = deriveOrgSlug(name);

  const withSuffix = (suffix: string) =>
    `${trimDashes(base.slice(0, MAX_LENGTH - suffix.length - 1))}-${suffix}`;

  return [
    base,
    ...Array.from({ length: NUMBERED_VARIANTS }, (_, index) =>
      withSuffix(String(index + 2))
    ),
    // Last resort, and the reason provisioning can retry itself: a fresh draw
    // is a fresh candidate, so a collision here is not a dead end.
    withSuffix(randomBytes(4).toString("hex")),
  ];
}
