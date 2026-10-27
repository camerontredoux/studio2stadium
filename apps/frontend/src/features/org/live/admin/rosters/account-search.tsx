import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ComboboxEmpty,
  ComboboxField,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxRoot,
} from "@/components/event/combobox";
import {
  type RosterType,
  rosterSearchQueries,
} from "@/features/org/api/roster-queries";
import { PersonAvatar } from "@/features/org/live/shared/person-avatar";

/** An account an admin can link to a Roster Entry. */
export interface AccountResult {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
}

const EMPTY: AccountResult[] = [];

function accountName(
  person: { firstName: string | null; lastName: string | null } | null,
): string {
  if (!person) return "";
  return [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
}

interface AccountSearchProps {
  orgSlug: string;
  eventId: string;
  /** Dancer accounts for a dancer entry, school accounts for a coach entry. */
  type: RosterType;
  enabled: boolean;
  onPick: (account: AccountResult) => void;
}

/** Search existing accounts by name or email and pick one. */
export function AccountSearch({
  orgSlug,
  eventId,
  type,
  enabled,
  onPick,
}: AccountSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searching = enabled && debouncedQuery.length >= 2;
  const dancerQuery = useQuery({
    ...rosterSearchQueries.dancerUsers(orgSlug, eventId, debouncedQuery),
    enabled: searching && type === "dancer",
  });
  const schoolQuery = useQuery({
    ...rosterSearchQueries.schoolUsers(orgSlug, eventId, debouncedQuery),
    enabled: searching && type === "coach",
  });
  const searchQuery = type === "dancer" ? dancerQuery : schoolQuery;

  // Base UI reads `items` in a layout effect, so an unstable reference here
  // loops until it blows the update-depth limit.
  const dancerData = dancerQuery.data;
  const schoolData = schoolQuery.data;
  const results = useMemo<AccountResult[]>(() => {
    if (type === "dancer") return dancerData ?? EMPTY;
    return schoolData?.map((user) => ({ ...user, avatar: null })) ?? EMPTY;
  }, [type, dancerData, schoolData]);

  const itemToStringLabel = useCallback(
    (user: AccountResult) => `${accountName(user)} ${user.email}`.trim(),
    [],
  );

  const emptyMessage =
    debouncedQuery.trim().length < 2
      ? "Type at least 2 characters to search."
      : searchQuery.isLoading
        ? "Searching…"
        : "No accounts found.";

  return (
    <ComboboxRoot
      items={results}
      filter={null}
      value={null}
      itemToStringLabel={itemToStringLabel}
      onInputValueChange={setQuery}
      onValueChange={(user: AccountResult | null) => {
        if (user) onPick(user);
      }}
      autoHighlight
    >
      <ComboboxField
        aria-label="Search accounts by name or email"
        placeholder="Search"
        loading={searching && searchQuery.isFetching}
      />
      <ComboboxPopup aria-label="Matching accounts">
        <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(user: AccountResult) => (
            <ComboboxItem key={user.id} value={user}>
              <PersonAvatar
                firstName={user.firstName}
                lastName={user.lastName}
                src={user.avatar}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-body-strong text-fg truncate">
                  {accountName(user) || user.email}
                </span>
                <span className="type-caption text-fg-2 truncate">
                  {user.email}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </ComboboxRoot>
  );
}
