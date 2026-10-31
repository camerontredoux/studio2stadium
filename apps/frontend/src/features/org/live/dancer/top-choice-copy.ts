import { UNLIMITED_SELECTIONS } from "./dancer-scouting";

/** Why a top-choice control is disabled, for its `title`. */
export function choiceHint({
  canEdit,
  full,
  max,
}: {
  canEdit: boolean;
  full: boolean;
  max: number;
}): string | undefined {
  if (!canEdit) return "Top choices can only be changed for the live event";
  if (full && max !== UNLIMITED_SELECTIONS)
    return `You can pick up to ${max} schools`;
  return undefined;
}
