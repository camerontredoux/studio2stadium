// The onboarding application form keeps its unsaved phone number in
// sessionStorage under this prefix plus the user id. Logout clears them all,
// so the next person on the same tab can't read one.
const PHONE_DRAFT_PREFIX = "application-phone-draft:";

export const phoneDraftKeyFor = (userId: string) =>
  `${PHONE_DRAFT_PREFIX}${userId}`;

export function clearPhoneDrafts() {
  const keys = Array.from({ length: sessionStorage.length }, (_, i) =>
    sessionStorage.key(i),
  );
  for (const key of keys) {
    if (key?.startsWith(PHONE_DRAFT_PREFIX)) {
      sessionStorage.removeItem(key);
    }
  }
}
